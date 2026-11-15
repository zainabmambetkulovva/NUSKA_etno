import { StarIcon } from '@/components/ui/icons';

export function Stars({ value, label }: { value: number; label?: string }) {
  return (
    <span className="inline-flex text-[#D9A441]" role="img" aria-label={label ?? `${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} filled={i <= Math.round(value)} width={16} height={16} />
      ))}
    </span>
  );
}
