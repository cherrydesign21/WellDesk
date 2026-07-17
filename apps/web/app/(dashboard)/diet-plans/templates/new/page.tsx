import { NewTemplateForm } from '@/components/diet-plans/new-template-form';

export default function NewDietPlanTemplatePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New template</h1>
      <NewTemplateForm />
    </div>
  );
}
