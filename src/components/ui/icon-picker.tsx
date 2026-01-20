import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

const categoryIcons = [
  'Tag', 'Wallet', 'Briefcase', 'TrendingUp', 'DollarSign',
  'Utensils', 'ShoppingCart', 'ShoppingBag', 'Car', 'Bus',
  'Plane', 'Home', 'Building', 'Heart', 'HeartPulse',
  'Gamepad2', 'Music', 'Film', 'Book', 'GraduationCap',
  'Laptop', 'Smartphone', 'Wifi', 'Zap', 'Droplets',
  'Fuel', 'Pill', 'Stethoscope', 'Dumbbell', 'Coffee',
  'Gift', 'Package', 'CreditCard', 'Banknote', 'PiggyBank',
  'Receipt', 'Calculator', 'Scissors', 'Shirt', 'Baby',
  'Dog', 'Cat', 'TreeDeciduous', 'Sun', 'Moon',
  'Star', 'Sparkles', 'Crown', 'Award', 'Target',
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color?: string;
}

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  
  const IconComponent = (LucideIcons as any)[value] || LucideIcons.Tag;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-10 w-10 p-0"
          style={{ backgroundColor: color ? `${color}20` : undefined }}
        >
          <IconComponent className="h-5 w-5" style={{ color: color }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2" align="start">
        <div className="grid grid-cols-8 gap-1">
          {categoryIcons.map((iconName) => {
            const Icon = (LucideIcons as any)[iconName] || LucideIcons.Tag;
            return (
              <button
                key={iconName}
                type="button"
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                  "hover:bg-secondary",
                  value === iconName && "bg-primary/10 ring-2 ring-primary/50"
                )}
                onClick={() => {
                  onChange(iconName);
                  setOpen(false);
                }}
              >
                <Icon className="h-4 w-4" style={{ color: color }} />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function CategoryIcon({ 
  iconName, 
  color, 
  className 
}: { 
  iconName: string; 
  color?: string; 
  className?: string;
}) {
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Tag;
  return <IconComponent className={className} style={{ color }} />;
}
