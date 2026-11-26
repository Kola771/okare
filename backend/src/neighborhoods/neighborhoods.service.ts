import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Neighborhood } from '@/entities/neighborhood.entity';
import { CreateNeighborhoodDto } from './dto/create-neighborhood.dto';
import { UpdateNeighborhoodDto } from './dto/update-neighborhood.dto';

/**
 * Service CRUD pour la table "neighborhoods" (quartiers).
 *
 * - Utilise le repository TypeORM → fonctionne sur PostgreSQL et MySQL.
 * - Toutes les fonctions utilisent un try/catch.
 * - Les erreurs SQL ne sont jamais exposées à l'utilisateur.
 */
@Injectable()
export class NeighborhoodsService {
  private readonly logger = new Logger(NeighborhoodsService.name);

  constructor(
    @InjectRepository(Neighborhood)
    private readonly repo: Repository<Neighborhood>,
  ) {}

  /** Retourne tous les quartiers triés par nom, avec la zone associée. */
  async findAll(): Promise<Neighborhood[]> {
    try {
      return await this.repo.find({
        order: { name: 'ASC' },
        relations: ['zone'],
      });
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des quartiers', error);
      throw new InternalServerErrorException('Impossible de récupérer la liste des quartiers.');
    }
  }

  /** Retourne les quartiers d'une zone donnée. */
  async findByZone(zoneId: string): Promise<Neighborhood[]> {
    try {
      return await this.repo.find({
        where: { zoneId },
        order: { name: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des quartiers de la zone ${zoneId}`, error);
      throw new InternalServerErrorException('Impossible de récupérer les quartiers de cette zone.');
    }
  }

  /** Retourne un quartier par son UUID. */
  async findOne(id: string): Promise<Neighborhood> {
    try {
      const neighborhood = await this.repo.findOne({
        where: { id },
        relations: ['zone'],
      });

      if (!neighborhood) {
        throw new NotFoundException('Quartier introuvable.');
      }

      return neighborhood;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la récupération du quartier ${id}`, error);
      throw new InternalServerErrorException('Impossible de récupérer ce quartier.');
    }
  }

  /**
   * Crée un nouveau quartier.
   * - Vérifie l'unicité du couple (zoneId, name).
   */
  async create(dto: CreateNeighborhoodDto): Promise<Neighborhood> {
    try {
      await this.checkNameUniqueInZone(dto.zoneId, dto.name);

      const neighborhood = this.repo.create(dto);

      return await this.repo.save(neighborhood);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error('Erreur lors de la création du quartier', error);
      throw new InternalServerErrorException('Impossible de créer ce quartier.');
    }
  }

  /**
   * Met à jour un quartier existant.
   * - Si le nom ou la zone change, vérifie l'unicité du couple (zoneId, name).
   */
  async update(id: string, dto: UpdateNeighborhoodDto): Promise<Neighborhood> {
    try {
      const neighborhood = await this.findOne(id);

      if (dto.name || dto.zoneId) {
        const zoneId = dto.zoneId ?? neighborhood.zoneId;
        const name = dto.name ?? neighborhood.name;
        await this.checkNameUniqueInZone(zoneId, name, id);
      }

      Object.assign(neighborhood, dto);

      return await this.repo.save(neighborhood);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      this.logger.error(`Erreur lors de la modification du quartier ${id}`, error);
      throw new InternalServerErrorException('Impossible de modifier ce quartier.');
    }
  }

  /** Supprime un quartier par son UUID. */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const neighborhood = await this.findOne(id);

      await this.repo.remove(neighborhood);

      return { message: 'Quartier supprimé avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la suppression du quartier ${id}`, error);
      throw new InternalServerErrorException('Impossible de supprimer ce quartier.');
    }
  }

  /** Vérifie qu'aucun autre quartier n'utilise ce nom dans cette zone. */
  private async checkNameUniqueInZone(zoneId: string, name: string, excludeId?: string): Promise<void> {
    const where: Record<string, unknown> = { zoneId, name };
    if (excludeId) {
      where.id = Not(excludeId);
    }

    const existing = await this.repo.findOne({
      where,
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Un quartier avec ce nom existe déjà dans cette zone.');
    }
  }
}
