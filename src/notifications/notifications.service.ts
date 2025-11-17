import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { Tutor } from '../usuarios/entities/tutor.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Tutor)
    private tutorRepository: Repository<Tutor>,
  ) {}

  /**
   * Crear una notificación para un tutor específico
   */
  async create(
    tutorId: number,
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const tutor = await this.tutorRepository.findOne({
      where: { id: tutorId },
    });

    if (!tutor) {
      throw new NotFoundException(`Tutor con ID ${tutorId} no encontrado`);
    }

    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      tipo: createNotificationDto.tipo || 'info',
      tutor,
    });

    try {
      return await this.notificationRepository.save(notification);
    } catch (error) {
      throw new BadRequestException('Error al crear la notificación');
    }
  }

  /**
   * Obtener todas las notificaciones de un tutor con filtros opcionales
   */
  async findAllByTutor(
    tutorId: number,
    queryDto: QueryNotificationsDto,
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const { tipo, leida, limit = 50, offset = 0 } = queryDto;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.tutor.id = :tutorId', { tutorId })
      .orderBy('notification.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    // Filtros opcionales
    if (tipo) {
      queryBuilder.andWhere('notification.tipo = :tipo', { tipo });
    }

    if (leida !== undefined) {
      queryBuilder.andWhere('notification.leida = :leida', { leida });
    }

    const [notifications, total] = await queryBuilder.getManyAndCount();

    // Obtener conteo de no leídas
    const unreadCount = await this.notificationRepository.count({
      where: {
        tutor: { id: tutorId },
        leida: false,
      },
    });

    return {
      notifications,
      total,
      unreadCount,
    };
  }

  /**
   * Obtener una notificación específica
   */
  async findOne(id: number, tutorId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, tutor: { id: tutorId } },
    });

    if (!notification) {
      throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
    }

    return notification;
  }

  /**
   * Marcar una o varias notificaciones como leídas
   */
  async markAsRead(
    notificationIds: number[],
    tutorId: number,
  ): Promise<{ updated: number }> {
    if (!notificationIds || notificationIds.length === 0) {
      throw new BadRequestException(
        'Debe proporcionar al menos un ID de notificación',
      );
    }

    // Verificar que todas las notificaciones pertenecen al tutor
    const notifications = await this.notificationRepository.find({
      where: {
        id: In(notificationIds),
        tutor: { id: tutorId },
      },
    });

    if (notifications.length !== notificationIds.length) {
      throw new ForbiddenException(
        'No tienes permiso para modificar algunas de estas notificaciones',
      );
    }

    const result = await this.notificationRepository.update(
      {
        id: In(notificationIds),
        tutor: { id: tutorId },
        leida: false,
      },
      {
        leida: true,
      },
    );

    return { updated: result.affected || 0 };
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(tutorId: number): Promise<{ updated: number }> {
    const result = await this.notificationRepository.update(
      {
        tutor: { id: tutorId },
        leida: false,
      },
      {
        leida: true,
      },
    );

    return { updated: result.affected || 0 };
  }

  /**
   * Eliminar una notificación
   */
  async remove(id: number, tutorId: number): Promise<void> {
    const notification = await this.findOne(id, tutorId);
    await this.notificationRepository.remove(notification);
  }

  /**
   * Eliminar múltiples notificaciones
   */
  async removeMany(
    notificationIds: number[],
    tutorId: number,
  ): Promise<{ deleted: number }> {
    if (!notificationIds || notificationIds.length === 0) {
      throw new BadRequestException(
        'Debe proporcionar al menos un ID de notificación',
      );
    }

    // Verificar que todas las notificaciones pertenecen al tutor
    const notifications = await this.notificationRepository.find({
      where: {
        id: In(notificationIds),
        tutor: { id: tutorId },
      },
    });

    if (notifications.length === 0) {
      return { deleted: 0 };
    }

    if (notifications.length !== notificationIds.length) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar algunas de estas notificaciones',
      );
    }

    await this.notificationRepository.remove(notifications);

    return { deleted: notifications.length };
  }

  /**
   * Obtener el conteo de notificaciones no leídas
   */
  async getUnreadCount(tutorId: number): Promise<{ count: number }> {
    const count = await this.notificationRepository.count({
      where: {
        tutor: { id: tutorId },
        leida: false,
      },
    });

    return { count };
  }

  /**
   * Limpiar notificaciones antiguas (más de 30 días)
   */
  async cleanOldNotifications(days: number = 30): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .andWhere('leida = true')
      .execute();

    return { deleted: result.affected || 0 };
  }
}
