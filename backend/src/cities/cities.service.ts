import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { City } from '@/entities/city.entity';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

/**
 * Service CRUD pour la table "cities".
 *
 * - Utilise le repository TypeORM → fonctionne sur PostgreSQL et MySQL.
 * - Toutes les fonctions utilisent un try/catch.
 * - Les erreurs SQL ne sont jamais exposées à l'utilisateur.
 */
@Injectable()
export class CitiesService {
  private readonly logger = new Logger(CitiesService.name);

  constructor(
    @InjectRepository(City)
    private readonly repo: Repository<City>,
  ) {}

  /** Retourne toutes les villes triées par nom, avec le pays associé. */
  async findAll(): Promise<City[]> {
    try {
      return await this.repo.find({
        order: { name: 'ASC' },
        relations: ['country'],
      });
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des villes', error);
      throw new InternalServerErrorException('Impossible de récupérer la liste des villes.');
    }
  }

  /** Retourne les villes d'un pays donné. */
  async findByCountry(countryId: string): Promise<City[]> {
    try {
      return await this.repo.find({
        where: { countryId },
        order: { name: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des villes du pays ${countryId}`, error);
      throw new InternalServerErrorException('Impossible de récupérer les villes de ce pays.');
    }
  }

  /** Retourne une ville par son UUID. Lève NotFoundException si introuvable. */
  async findOne(id: string): Promise<City> {
    try {
      const city = await this.repo.findOne({
        where: { id },
        relations: ['country'],
      });

      if (!city) {
        throw new NotFoundException('Ville introuvable.');
      }

      return city;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la récupération de la ville ${id}`, error);
      throw new InternalServerErrorException('Impossible de récupérer cette ville.');
    }
  }

  /**
   * Crée une nouvelle ville.
   * - Vérifie l'unicité du slug avant insertion.
   */
  async create(dto: CreateCityDto): Promise<City> {
    try {
      await this.checkSlugUnique(dto.slug);

      const city = this.repo.create(dto);

      return await this.repo.save(city);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error('Erreur lors de la création de la ville', error);
      throw new InternalServerErrorException('Impossible de créer cette ville.');
    }
  }

  /**
   * Met à jour une ville existante.
   * - Si le slug est modifié, vérifie son unicité.
   */
  async update(id: string, dto: UpdateCityDto): Promise<City> {
    try {
      const city = await this.findOne(id);

      if (dto.slug) {
        await this.checkSlugUnique(dto.slug, id);
      }

      Object.assign(city, dto);

      return await this.repo.save(city);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      this.logger.error(`Erreur lors de la modification de la ville ${id}`, error);
      throw new InternalServerErrorException('Impossible de modifier cette ville.');
    }
  }

  /** Supprime une ville par son UUID. */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const city = await this.findOne(id);

      await this.repo.remove(city);

      return { message: 'Ville supprimée avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la suppression de la ville ${id}`, error);
      throw new InternalServerErrorException('Impossible de supprimer cette ville.');
    }
  }

  /** Vérifie qu'aucune autre ville n'utilise ce slug (unicité). */
  private async checkSlugUnique(slug: string, excludeId?: string): Promise<void> {
    const existing = await this.repo.findOne({
      where: excludeId
        ? { slug, id: Not(excludeId) }
        : { slug },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Une ville avec ce slug existe déjà.');
    }
  }
}
