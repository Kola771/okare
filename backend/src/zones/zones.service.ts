import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Zone } from '@/entities/zone.entity';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

/**
 * Service CRUD pour la table "zones".
 *
 * - Utilise le repository TypeORM → fonctionne sur PostgreSQL et MySQL.
 * - Toutes les fonctions utilisent un try/catch.
 * - Les erreurs SQL ne sont jamais exposées à l'utilisateur.
 * - Note : le champ "boundary" (geography) n'est pas géré ici — il sera
 *   traité via un endpoint dédié avec requêtes spatiales (raw SQL).
 */
@Injectable()
export class ZonesService {
  private readonly logger = new Logger(ZonesService.name);

  constructor(
    @InjectRepository(Zone)
    private readonly repo: Repository<Zone>,
  ) {}

  /** Retourne toutes les zones triées par nom, avec la ville et la catégorie. */
  async findAll(): Promise<Zone[]> {
    try {
      return await this.repo.find({
        order: { name: 'ASC' },
        relations: ['city', 'category'],
      });
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des zones', error);
      throw new InternalServerErrorException('Impossible de récupérer la liste des zones.');
    }
  }

  /** Retourne les zones d'une ville donnée. */
  async findByCity(cityId: string): Promise<Zone[]> {
    try {
      return await this.repo.find({
        where: { cityId },
        order: { name: 'ASC' },
        relations: ['category'],
      });
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des zones de la ville ${cityId}`, error);
      throw new InternalServerErrorException('Impossible de récupérer les zones de cette ville.');
    }
  }

  /** Retourne une zone par son UUID. */
  async findOne(id: string): Promise<Zone> {
    try {
      const zone = await this.repo.findOne({
        where: { id },
        relations: ['city', 'category'],
      });

      if (!zone) {
        throw new NotFoundException('Zone introuvable.');
      }

      return zone;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la récupération de la zone ${id}`, error);
      throw new InternalServerErrorException('Impossible de récupérer cette zone.');
    }
  }

  /**
   * Crée une nouvelle zone.
   * - Vérifie l'unicité du couple (cityId, code).
   */
  async create(dto: CreateZoneDto): Promise<Zone> {
    try {
      await this.checkCodeUniqueInCity(dto.cityId, dto.code);

      const zone = this.repo.create(dto);

      return await this.repo.save(zone);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error('Erreur lors de la création de la zone', error);
      throw new InternalServerErrorException('Impossible de créer cette zone.');
    }
  }

  /**
   * Met à jour une zone existante.
   * - Si le code ou la ville change, vérifie l'unicité du couple (cityId, code).
   */
  async update(id: string, dto: UpdateZoneDto): Promise<Zone> {
    try {
      const zone = await this.findOne(id);

      if (dto.code || dto.cityId) {
        const cityId = dto.cityId ?? zone.cityId;
        const code = dto.code ?? zone.code;
        await this.checkCodeUniqueInCity(cityId, code, id);
      }

      Object.assign(zone, dto);

      return await this.repo.save(zone);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      this.logger.error(`Erreur lors de la modification de la zone ${id}`, error);
      throw new InternalServerErrorException('Impossible de modifier cette zone.');
    }
  }

  /** Supprime une zone par son UUID. */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const zone = await this.findOne(id);

      await this.repo.remove(zone);

      return { message: 'Zone supprimée avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la suppression de la zone ${id}`, error);
      throw new InternalServerErrorException('Impossible de supprimer cette zone.');
    }
  }

  /** Vérifie qu'aucune autre zone n'utilise ce code dans cette ville. */
  private async checkCodeUniqueInCity(cityId: string, code: string, excludeId?: string): Promise<void> {
    const where: Record<string, unknown> = { cityId, code };
    if (excludeId) {
      where.id = Not(excludeId);
    }

    const existing = await this.repo.findOne({
      where,
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Une zone avec ce code existe déjà dans cette ville.');
    }
  }
}
