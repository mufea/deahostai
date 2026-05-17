import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Zap, Star, Coins, Info } from 'lucide-react';

export default function ModelComparison({ models, type }) {
  const { t } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="h-4 w-4" />
          {t('models.compare_models', 'Compare Models')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('models.compare_models', 'Compare Models')}</DialogTitle>
          <DialogDescription>
            Review the capabilities, speed, and cost of available {type} models to choose the best one for your needs.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[200px]">{t('models.ai_model', 'AI Model')}</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-amber-500" />
                    {t('models.speed', 'Speed')}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-primary" />
                    {t('models.quality', 'Quality')}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-emerald-500" />
                    {t('models.cost', 'Cost')}
                  </div>
                </TableHead>
                <TableHead>Best For</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">
                    {model.name}
                    {model.badge && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {model.badge}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{model.provider}</TableCell>
                  <TableCell>{t(`models.${model.speed.toLowerCase()}`, model.speed)}</TableCell>
                  <TableCell>{t(`models.${model.quality.toLowerCase()}`, model.quality)}</TableCell>
                  <TableCell>{model.baseCost} {t('models.credits_per_req', 'credits/req')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{model.desc}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}