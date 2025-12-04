import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

const STAGES = ["counting", "cleaning", "stamping", "ironing", "packaging", "completed"];

const stageLabels = {
  counting: "Counting",
  cleaning: "Cleaning",
  stamping: "Stamping",
  ironing: "Ironing",
  packaging: "Packaging",
  completed: "Completed"
};

export default function BatchProgress({ currentStage }) {
  const currentIndex = STAGES.indexOf(currentStage);

  return (
    <div className="flex items-center justify-between w-full">
      {STAGES.slice(0, -1).map((stage, index) => (
        <div key={stage} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                index < currentIndex
                  ? "bg-emerald-500 text-white"
                  : index === currentIndex
                  ? "bg-blue-500 text-white ring-4 ring-blue-100"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              {index < currentIndex ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <span className="text-xs font-semibold">{index + 1}</span>
              )}
            </div>
            <span
              className={`text-xs mt-1 font-medium ${
                index <= currentIndex ? "text-slate-700" : "text-slate-400"
              }`}
            >
              {stageLabels[stage]}
            </span>
          </div>
          {index < STAGES.length - 2 && (
            <div
              className={`w-8 md:w-12 h-0.5 mx-1 ${
                index < currentIndex ? "bg-emerald-500" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}