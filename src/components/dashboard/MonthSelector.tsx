import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useRef, useEffect } from "react";

interface MonthSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function MonthSelector({
  selectedDate,
  onDateChange,
}: MonthSelectorProps) {
  const [baseMonth, setBaseMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const monthRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const monthsToShow =
    window.innerWidth >= 500 && window.innerWidth <= 640
      ? 5
      : window.innerWidth <= 690
        ? 3
        : window.innerWidth <= 1170
          ? 5
          : 7;

  const handlePrev = () => {
    setBaseMonth(subMonths(baseMonth, monthsToShow));
  };

  const handleNext = () => {
    setBaseMonth(addMonths(baseMonth, monthsToShow));
  };

  const handleCurrentMonth = (date: Date) => {
    onDateChange(date);
    setBaseMonth(date);
  };

  const months = Array.from({ length: monthsToShow }, (_, i) => {
    i = i - (monthsToShow === 7 ? 3 : monthsToShow === 5 ? 2 : 1);
    const date = new Date(baseMonth);
    date.setMonth(baseMonth.getMonth() + i);
    return date;
  });

  useEffect(() => {
    const idx = months.findIndex(
      (d) => format(d, "yyyy-MM") === format(selectedDate, "yyyy-MM"),
    );
    if (idx >= 0) {
      const el = monthRefs.current[idx];
      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [baseMonth, monthsToShow, selectedDate]);

  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-lg sm:w-auto sm:justify-center">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handlePrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory px-2"
        role="list"
      >
        {months.map((date, index) => (
          <Button
            key={index}
            ref={(el: HTMLButtonElement | null) =>
              (monthRefs.current[index] = el)
            }
            variant={
              format(selectedDate, "yyyy-MM") === format(date, "yyyy-MM")
                ? "default"
                : "outline"
            }
            className="min-w-[80px] capitalize snap-center"
            onClick={() => handleCurrentMonth(date)}
          >
            {format(date, "MMM/yy", { locale: ptBR })}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
