"use client";

import {
  ComponentProps,
  createContext,
  DetailedHTMLProps,
  FormHTMLAttributes,
  useContext,
  useId,
} from "react";

import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  UseFormReturn,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";

const Form = <
  TFieldValues extends FieldValues,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TContext = any,
  TTransformedValues = TFieldValues,
>({
  form,
  children,
  ...props
}: {
  form: UseFormReturn<TFieldValues, TContext, TTransformedValues>;
} & DetailedHTMLProps<
  FormHTMLAttributes<HTMLFormElement>,
  HTMLFormElement
>) => {
  return (
    <FormProvider {...form}>
      <form {...props}>
        {children}
        {/* {Children.map(children, (child) => {
          if (
            isValidElement(child) &&
            child.type instanceof FormField &&
            typeof child.props === "object" &&
            child.props &&
            "name" in child.props &&
            typeof child.props.name === "string"
          ) {
           return (
            <FormField
            control={form.control}
              name={child.props.name as FieldPath<TFieldValues>}
              key={child.props.name}
            >
              {createElement(child.type, {
              ...child.props,
              ...form.register(child.props.name as FieldPath<TFieldValues>),
              key: child.props.name,
            })}
            </FormField>
           );
          }

          return child;
        })} */}
      </form>
    </FormProvider>
  );
};

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = { name: TName; description?: string };

const FormFieldContext = createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  description,
  className,
  render,
  ...props
}: ControllerProps<TFieldValues, TName, TTransformedValues> & {
  description?: string;
  className?: string;
}) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name, description }}>
      <Controller
        {...props}
        render={(args) => (
          <FormItem className={className}>{render(args)}</FormItem>
        )}
      />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    description: fieldContext.description,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = { id: string };

const FormItemContext = createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

function FormItem({ className, children, ...props }: ComponentProps<"div">) {
  const id = useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      >
        <FormControl>{children}</FormControl>
        {/* <FormDescription /> */}
        <FormMessage />
      </div>
    </FormItemContext.Provider>
  );
}

function FormControl({ ...props }: ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: ComponentProps<"p">) {
  const { description, error, formMessageId } = useFormField();
  const body = error
    ? String(error?.message ?? "")
    : (props.children ?? description);

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-sm", error && "text-error", className)}
      {...props}
    >
      {body}
    </p>
  );
}

export {
  // useFormField,
  Form,
  // FormItem,
  FormControl,
  FormMessage,
  FormField,
};
