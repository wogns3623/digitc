"use client";
import { useEffect } from "react";
import { z } from "zod";

import { getPublicClient, getWalletClient } from "@/lib/blockchain";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";

const formSchema = z.object({
  releasedAt: z.date(),
  fee: z.number(),
});

export default function Home() {
  const publicClient = getPublicClient();
  const walletClient = getWalletClient();

  useEffect(() => {
    (async () => {
      console.log("Wallet account:", walletClient.account);
      if (walletClient.account) {
        const balance = await publicClient.getBalance({
          address: walletClient.account.address,
        });
        console.log("Balance:", balance);
      }
    })();
  }, [publicClient, walletClient]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      releasedAt: new Date(),
      fee: 0,
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }

  return (
    <section className="h-screen p-8 flex flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">타임캡슐</h1>
        <p className="text-lg text-gray-600">
          블록체인에 당신의 추억을 저장하세요.
        </p>
      </div>

      <div className="flex flex-col space-y-4 w-64 mt-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col space-y-8"
          >
            <FormField
              control={form.control}
              name="releasedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>개봉일</FormLabel>
                  <FormControl>
                    <DatePicker {...field} />
                  </FormControl>
                  <FormDescription>타임캡슐이 개봉될 날짜</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fee"
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>수수료</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="수수료 (ETH)"
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>참여자가 받을 수수료 (ETH)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">새 타임캡슐 만들기</Button>
          </form>
        </Form>

        <Button>내 타임캡슐 보기</Button>
        <Button>다른 타임캡슐에 참여하기</Button>
      </div>
    </section>
  );
}
