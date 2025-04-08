
import React from "react";
import { Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface TestFormFieldProps {
  control: Control<any>; // Using any to accommodate both string and number types
  name: string;
  label: string;
  description?: string;
  type?: string;
  min?: string;
  max?: string;
}

const TestFormField = ({
  control,
  name,
  label,
  description,
  type = "text",
  min,
  max,
}: TestFormFieldProps) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} type={type} min={min} max={max} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TestFormField;
