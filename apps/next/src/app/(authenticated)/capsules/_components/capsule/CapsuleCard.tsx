import { useEffect } from "react";

import dayjs from "dayjs";
import { useCountdown } from "usehooks-ts";

import { Vault } from "@/lib/blockchain/contracts";
import { cn } from "@/lib/utils";

import { CapsuleFooter } from "./footer/CapsuleFooter";

const ETH = 10n ** 18n; // 1 ETH in wei
export function CapsuleCard({
  capsule,
  participant,
}: {
  capsule: Vault.Capsule;
  participant?: Vault.Participant;
}) {
  const releasedAt = dayjs.unix(Number(capsule.releasedAt));

  return (
    <li className="card card-border bg-base-300 min-w-lg shadow-xl">
      <div className="card-body space-y-2">
        <section className="card-title flex items-center justify-between space-x-8">
          <span className="flex items-center space-x-2">
            <span className="text-base-content/70">No. {capsule.id}</span>
            <div
              className={cn("badge badge-sm badge-soft", {
                "badge-primary":
                  capsule.status === Vault.CapsuleStatus.Registered,
                "badge-success":
                  capsule.status === Vault.CapsuleStatus.Encrypted,
                "badge-warning":
                  capsule.status === Vault.CapsuleStatus.Decrypted,
                "badge-accent": capsule.status === Vault.CapsuleStatus.Approved,
              })}
            >
              {Vault.CapsuleStatusLabels[capsule.status as Vault.CapsuleStatus]}
            </div>
          </span>

          <CapsuleCountdown releasedAt={releasedAt} />
        </section>

        <h2 className="text-4xl">{capsule.title}</h2>

        <section className="text-base-content/70 space-y-2 text-sm">
          <p>수수료: {capsule.fee / ETH} ETH</p>
          <p>참여자: {capsule.participantCount}명</p>
          <p>개봉일: {releasedAt.format("YYYY-MM-DD HH:mm:ss")}</p>
        </section>

        <div className="card-actions flex justify-between">
          <CapsuleFooter capsule={capsule} participant={participant} />
        </div>
      </div>
    </li>
  );
}

function CapsuleCountdown({ releasedAt }: { releasedAt: dayjs.Dayjs }) {
  const { isNegative, days, hours, minutes, seconds } =
    useCapsuleCountdown(releasedAt);

  return (
    <span className="font-mono text-2xl">
      {isNegative ? "-" : ""}
      {days > 0 && <span>{String(days).padStart(3, "0")}d</span>}
      <span className="countdown">
        <span style={{ "--value": hours } as React.CSSProperties}>{hours}</span>
        h
        <span style={{ "--value": minutes } as React.CSSProperties}>
          {minutes}
        </span>
        m
        <span style={{ "--value": seconds } as React.CSSProperties}>
          {seconds}
        </span>
        s
      </span>
    </span>
  );
}

function useCapsuleCountdown(releasedAt: dayjs.Dayjs) {
  const countdown = useCountdown({
    countStart: releasedAt.diff(dayjs(), "seconds"),
    intervalMs: 1000,
    countStop: -Infinity,
  });
  const { startCountdown } = countdown[1];

  useEffect(() => {
    startCountdown();
  }, [startCountdown]);

  let [count] = countdown;
  const isNegative = count < 0;

  if (isNegative) count = -count;

  const days = Math.floor(count / (3600 * 24));
  const hours = Math.floor((count % (3600 * 24)) / 3600);
  const minutes = Math.floor((count % 3600) / 60);
  const seconds = count % 60;

  return { isNegative, days, hours, minutes, seconds };
}
