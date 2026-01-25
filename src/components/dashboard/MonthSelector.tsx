import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function MonthSelector({
  selectedDate,
  onDateChange,
}: MonthSelectorProps) {
  const handlePrevMonth = () => {
    onDateChange(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(selectedDate, 1));
  };

  const handleCurrentMonth = () => {
    onDateChange(new Date());
  };

  const isCurrentMonth =
    format(selectedDate, "yyyy-MM") === format(new Date(), "yyyy-MM");

  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-lg sm:w-auto sm:justify-center">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handlePrevMonth}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant={isCurrentMonth ? "default" : "outline"}
        className="min-w-[100px] capitalize"
        onClick={handleCurrentMonth}
      >
        {format(selectedDate, "MMM/yy", { locale: ptBR })}
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleNextMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
