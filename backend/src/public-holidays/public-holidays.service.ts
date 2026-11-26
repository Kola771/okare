import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { PublicHoliday } from '@/entities/public-holiday.entity';
import { CreatePublicHolidayDto } from './dto/create-public-holiday.dto';
import { UpdatePublicHolidayDto } from './dto/update-public-holiday.dto';

/**
 * Service CRUD pour la table "public_holidays" (jours fériés).
 *
 * - Utilise le repository TypeORM → fonctionne sur PostgreSQL et MySQL.
 * - Toutes les fonctions utilisent un try/catch.
 * - Les erreurs SQL ne sont jamais exposées à l'utilisateur.
 */
@Injectable()
export class PublicHolidaysService {
  private readonly logger = new Logger(PublicHolidaysService.name);

  constructor(
    @InjectRepository(PublicHoliday)
    private readonly repo: Repository<PublicHoliday>,
  ) {}

  /** Retourne tous les jours fériés triés par date, avec le pays. */
  async findAll(): Promise<PublicHoliday[]> {
    try {
      return await this.repo.find({
        order: { date: 'ASC' },
        relations: ['country'],
      });
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des jours fériés', error);
      throw new InternalServerErrorException('Impossible de récupérer les jours fériés.');
    }
  }

  /** Retourne les jours fériés d'un pays donné. */
  async findByCountry(countryId: string): Promise<PublicHoliday[]> {
    try {
      return await this.repo.find({
        where: { countryId },
        order: { date: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des jours fériés du pays ${countryId}`, error);
      throw new InternalServerErrorException('Impossible de récupérer les jours fériés de ce pays.');
    }
  }

  /** Retourne un jour férié par son UUID. */
  async findOne(id: string): Promise<PublicHoliday> {
    try {
      const holiday = await this.repo.findOne({
        where: { id },
        relations: ['country'],
      });

      if (!holiday) {
        throw new NotFoundException('Jour férié introuvable.');
      }

      return holiday;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la récupération du jour férié ${id}`, error);
      throw new InternalServerErrorException('Impossible de récupérer ce jour férié.');
    }
  }

  /**
   * Crée un nouveau jour férié.
   * - Vérifie l'unicité du couple (countryId, date).
   */
  async create(dto: CreatePublicHolidayDto): Promise<PublicHoliday> {
    try {
      await this.checkDateUniqueInCountry(dto.countryId, dto.date);

      const holiday = this.repo.create(dto);

      return await this.repo.save(holiday);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error('Erreur lors de la création du jour férié', error);
      throw new InternalServerErrorException('Impossible de créer ce jour férié.');
    }
  }

  /**
   * Met à jour un jour férié existant.
   * - Si le pays ou la date change, vérifie l'unicité du couple.
   */
  async update(id: string, dto: UpdatePublicHolidayDto): Promise<PublicHoliday> {
    try {
      const holiday = await this.findOne(id);

      if (dto.countryId || dto.date) {
        const countryId = dto.countryId ?? holiday.countryId;
        const date = dto.date ?? holiday.date;
        await this.checkDateUniqueInCountry(countryId, date, id);
      }

      Object.assign(holiday, dto);

      return await this.repo.save(holiday);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      this.logger.error(`Erreur lors de la modification du jour férié ${id}`, error);
      throw new InternalServerErrorException('Impossible de modifier ce jour férié.');
    }
  }

  /** Supprime un jour férié par son UUID. */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const holiday = await this.findOne(id);

      await this.repo.remove(holiday);

      return { message: 'Jour férié supprimé avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la suppression du jour férié ${id}`, error);
      throw new InternalServerErrorException('Impossible de supprimer ce jour férié.');
    }
  }

  /** Vérifie qu'aucun autre jour férié n'existe pour ce pays à cette date. */
  private async checkDateUniqueInCountry(countryId: string, date: string, excludeId?: string): Promise<void> {
    const where: Record<string, unknown> = { countryId, date };
    if (excludeId) {
      where.id = Not(excludeId);
    }

    const existing = await this.repo.findOne({
      where,
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Un jour férié existe déjà pour ce pays à cette date.');
    }
  }
}
