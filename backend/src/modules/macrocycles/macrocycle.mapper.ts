import { MacrocycleDto } from './dto/macrocycle.dto';

type StageRow = {
  id: string;
  templateId: string;
  sortOrder: number;
  template?: { name: string } | null;
};

type MacrocycleRow = {
  id: string;
  name: string;
  periodicityNote: string | null;
  stages: StageRow[];
};

/** Преобразует строку Prisma с этапами в DTO API. */
export function toMacrocycleDto(row: MacrocycleRow): MacrocycleDto {
  return {
    id: row.id,
    name: row.name,
    periodicityNote: row.periodicityNote,
    stages: row.stages.map((stage) => ({
      id: stage.id,
      templateId: stage.templateId,
      templateName: stage.template?.name ?? null,
      sortOrder: stage.sortOrder,
    })),
  };
}
