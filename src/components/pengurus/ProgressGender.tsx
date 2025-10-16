import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pengurus } from "@/lib/struktur-constants";

interface ProgressGenderProps {
  pengurusList: Pengurus[];
}

export const ProgressGender = ({ pengurusList }: ProgressGenderProps) => {
  const perempuanCount = pengurusList.filter(
    (p) => p.jenis_kelamin === "Perempuan"
  ).length;
  const totalCount = pengurusList.length;
  const perempuanPercentage =
    totalCount > 0 ? (perempuanCount / totalCount) * 100 : 0;
  const isValid = perempuanPercentage >= 30;

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle>Keterwakilan Perempuan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Persentase Perempuan</span>
            <span className={isValid ? "text-success" : "text-destructive"}>
              {perempuanPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={perempuanPercentage}
            className={`h-2 ${
              isValid
                ? "[&>div]:bg-green-500"
                : "[&>div]:bg-red-500"
            }`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {perempuanCount} dari {totalCount} pengurus
            </span>
            <span>{isValid ? "Memenuhi syarat" : "Minimal 30%"}</span>
          </div>
          {!isValid && totalCount > 0 && (
            <p className="text-xs text-destructive pt-2">
              Tambahkan minimal{" "}
              {Math.ceil(totalCount * 0.3) - perempuanCount} pengurus perempuan
              lagi untuk memenuhi syarat 30%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
