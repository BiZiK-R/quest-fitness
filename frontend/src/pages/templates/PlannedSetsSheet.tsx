import { useState } from 'react';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';
import type { ExerciseLine } from './template-draft';

type PlannedSetsSheetProps = {
  line: ExerciseLine;
  onApply: (patch: Partial<ExerciseLine>) => void;
  onClose: () => void;
};

/** План Упражнения в Шаблоне: подходы, повторы, вес, заметка. Правит черновик, не сохраняет на сервер. */
export function PlannedSetsSheet({ line, onApply, onClose }: PlannedSetsSheetProps) {
  const [plannedSets, setPlannedSets] = useState(line.plannedSets);
  const [plannedReps, setPlannedReps] = useState(line.plannedReps);
  const [plannedWeightKg, setPlannedWeightKg] = useState(line.plannedWeightKg);
  const [notes, setNotes] = useState(line.notes);

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={line.exerciseName || 'Упражнение'}
      footer={
        <Button
          variant="primary"
          fullWidth
          onClick={() => onApply({ plannedSets, plannedReps, plannedWeightKg, notes })}
        >
          Готово
        </Button>
      }
    >
      <div className="templates-sheet">
        <div className="templates-sheet__pair">
          <TextField
            label="Подходы"
            inputMode="numeric"
            value={plannedSets}
            onChange={(e) => setPlannedSets(e.target.value.replace(/\D/g, ''))}
            autoComplete="off"
          />
          <TextField
            label="Повторы"
            inputMode="numeric"
            value={plannedReps}
            onChange={(e) => setPlannedReps(e.target.value.replace(/\D/g, ''))}
            autoComplete="off"
          />
        </div>
        <TextField
          label="Вес"
          inputMode="decimal"
          value={plannedWeightKg}
          onChange={(e) => setPlannedWeightKg(e.target.value.replace(/[^\d.,]/g, ''))}
          autoComplete="off"
          trailing={<span className="templates-sheet__unit">кг</span>}
        />
        <TextField
          label="Заметка"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          autoComplete="off"
        />
      </div>
    </BottomSheet>
  );
}
