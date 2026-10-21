"use client";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { useTravelStore } from "@/store";
import { useMe } from "@/store/use-me";
import {
  onPayroll,
  payslip,
  recentPeriods,
  type PayPeriod,
} from "@/domain/payroll";
import { money, centavos } from "@/domain/money";
import type { PayslipRecord } from "@/domain/types";
import { Block, BigNumber, Sheet } from "@/components/blocks";
import { Modal, Field, notify } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const toRecord = (p: ReturnType<typeof payslip>): PayslipRecord => {
  const { agent, period: _period, ...rest } = p;
  void _period;
  return { agentId: agent.id, ...rest };
};

function Payslip({
  slip,
  name,
  role,
  pct,
  period,
}: {
  slip: PayslipRecord;
  name: string;
  role: string;
  pct: number;
  period: PayPeriod;
}) {
  const row = (label: React.ReactNode, value: number) => (
    <div className="row">
      <span>{label}</span>
      <b>{money(value)}</b>
    </div>
  );
  return (
    <div className="payslip" data-testid="payslip">
      <div className="pay-head">
        <div>
          <p className="eyebrow-sm">Payday · {period.label}</p>
          <b className="pay-title">
            {name} · {role}
          </b>
        </div>
      </div>
      <div className="slip">
        <div className="slip-col">
          <p className="slip-h">Earnings</p>
          {row("Base pay (half month)", slip.base)}
          {row(
            <>
              Commission · {pct}% of{" "}
              {money(slip.commissionBookings.reduce((s, b) => s + b.profit, 0))}{" "}
              profit
              <small>
                {slip.commissionBookings.length
                  ? slip.commissionBookings.map((b) => b.ref).join(", ")
                  : "No bookings closed this payday"}
              </small>
            </>,
            slip.commission,
          )}
          <div className="row tot">
            <span>Gross pay</span>
            <b>{money(slip.gross)}</b>
          </div>
        </div>
        <div className="slip-col">
          <p className="slip-h">Deductions</p>
          {row("SSS", slip.sss)}
          {row("PhilHealth", slip.philhealth)}
          {row("Pag-IBIG", slip.pagibig)}
          {row("Withholding tax", slip.tax)}
          {slip.advances > 0 && row("Cash advance", slip.advances)}
          <div className="row tot">
            <span>Total deductions</span>
            <b>{money(slip.deductions)}</b>
          </div>
        </div>
      </div>
      <div className="net">
        <span>Take-home pay</span>
        <b data-testid="payslip-net">{money(slip.net)}</b>
      </div>
    </div>
  );
}

export function Salary() {
  const s = useTravelStore(),
    { me, canSeeSalary } = useMe();
  const periods = useMemo(() => recentPeriods(new Date(), 4), []);
  const [key, setKey] = useState(periods[0].key),
    [open, setOpen] = useState<string | null>(null),
    [confirm, setConfirm] = useState(false),
    [advance, setAdvance] = useState(false);
  const period = periods.find((p) => p.key === key) ?? periods[0];

  if (!canSeeSalary)
    return (
      <>
        <section className="hello">
          <div>
            <h1>Salary</h1>
            <p>Pay and payslips.</p>
          </div>
        </section>
        <Block
          variant="white"
          title="Only the owner can see salaries"
          tag={`Signed in as ${me.name} · ${me.role}`}
        >
          <p>
            Switch to the owner in the account menu to see payroll. In the real
            portal, staff will see only their own payslips here.
          </p>
        </Block>
      </>
    );

  const staff = onPayroll(s.agents),
    approved = s.paydays.find((p) => p.period === period.key),
    live = staff.map((a) =>
      toRecord(payslip(a, period, s.bookings, s.cashAdvances)),
    ),
    slips = approved?.slips ?? live,
    total = (k: keyof PayslipRecord) =>
      slips.reduce((sum, x) => sum + (x[k] as number), 0),
    agentOf = (id: string) => s.agents.find((a) => a.id === id)!,
    openSlip = slips.find((x) => x.agentId === open),
    payDate = format(parseISO(period.end), "EEE d MMM");

  return (
    <>
      <section className="hello">
        <div>
          <h1>Salary</h1>
          <p>
            Payday {period.label} · paid {payDate}. Commission comes from
            bookings each person closed in this period.
          </p>
        </div>
        <Button variant="outline" onClick={() => setAdvance(true)}>
          + Cash advance
        </Button>
      </section>
      <nav className="filters pay-periods" aria-label="Payday">
        {periods.map((p, i) => (
          <button
            key={p.key}
            className={`chip ${p.key === key ? "active" : ""}`}
            aria-pressed={p.key === key}
            onClick={() => setKey(p.key)}
          >
            {p.label}
            {i === 0 ? " · this payday" : ""}
            {s.paydays.some((d) => d.period === p.key) ? " ✓" : ""}
          </button>
        ))}
      </nav>
      <section className="g3 salary-blocks">
        <Block variant="lime" tag="Take-home pay, all staff">
          <BigNumber value={total("net")} data-testid="payroll-net" />
          <p>
            {slips.length} staff · gross {money(total("gross"))}
          </p>
        </Block>
        <Block variant="char" tag="Commission earned">
          <BigNumber value={total("commission")} />
          <p>
            From {slips.reduce((n, x) => n + x.commissionBookings.length, 0)}{" "}
            bookings closed this payday
          </p>
        </Block>
        {approved ? (
          <Block variant="done" tag="✓ Approved" title="Payday approved">
            <p>
              By {agentOf(approved.approvedBy)?.name} on{" "}
              {format(parseISO(approved.approvedAt), "d MMM, h:mm a")}. Payslips
              are locked.
            </p>
          </Block>
        ) : (
          <Block
            variant="white"
            tag="Ready to approve"
            title="Check, then approve"
            action={
              <Button onClick={() => setConfirm(true)}>Approve payday</Button>
            }
          >
            <p>Approving locks these payslips for staff.</p>
          </Block>
        )}
      </section>

      <Sheet id="payroll" title="Payroll" note="Owner only">
        <div className="table-wrap">
          <table className="t payroll-table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Base</th>
                <th>Commission</th>
                <th>Deductions</th>
                <th>Take-home</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {slips.map((x) => {
                const a = agentOf(x.agentId);
                return (
                  <tr key={x.agentId} data-testid="payroll-row">
                    <td>
                      <b>{a.name}</b>
                      <small className="block-sub">{a.role}</small>
                    </td>
                    <td>{money(x.base)}</td>
                    <td>{money(x.commission)}</td>
                    <td>{money(x.deductions)}</td>
                    <td>
                      <b>{money(x.net)}</b>
                    </td>
                    <td>
                      <Button
                        variant="outline"
                        aria-label={`View ${a.name}'s payslip`}
                        onClick={() => setOpen(x.agentId)}
                      >
                        Payslip
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td>{money(total("base"))}</td>
                <td>{money(total("commission"))}</td>
                <td>{money(total("deductions"))}</td>
                <td>{money(total("net"))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Sheet>

      <Sheet
        id="pay-settings"
        title="Pay settings"
        note="Changes apply to paydays not yet approved"
      >
        <div className="pay-settings">
          {staff.map((a) => (
            <form
              key={`${a.id}-${a.monthlyBaseCentavos}-${a.commissionPct}`}
              className="pay-setting"
              onSubmit={(e) => {
                e.preventDefault();
                const d = new FormData(e.currentTarget);
                notify(
                  () =>
                    s.updatePay(
                      a.id,
                      centavos(String(d.get("base"))),
                      Number(d.get("pct")),
                    ),
                  `${a.name}'s pay updated`,
                );
              }}
            >
              <b>
                {a.name}
                <small className="block-sub">{a.role}</small>
              </b>
              <Field label="Monthly base (PHP)">
                <Input
                  name="base"
                  aria-label={`${a.name} monthly base`}
                  type="number"
                  min="0"
                  step="100"
                  defaultValue={(a.monthlyBaseCentavos ?? 0) / 100}
                />
              </Field>
              <Field label="Commission (% of profit)">
                <Input
                  name="pct"
                  aria-label={`${a.name} commission percent`}
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  defaultValue={a.commissionPct ?? 0}
                />
              </Field>
              <Button type="submit" variant="outline">
                Save
              </Button>
            </form>
          ))}
        </div>
        <p className="subtle-note">
          Demo estimate using 2025 employee rates: SSS 5% of the monthly salary
          credit, PhilHealth 2.5%, Pag-IBIG 2% (up to ₱200 a month), and the BIR
          semi-monthly tax table. Confirm with your accountant before real use.
        </p>
      </Sheet>

      <Modal
        open={!!openSlip}
        onOpenChange={(v) => !v && setOpen(null)}
        title="Payslip"
        description={
          approved ? "Approved and locked." : "Draft until payday is approved."
        }
      >
        {openSlip && (
          <Payslip
            slip={openSlip}
            name={agentOf(openSlip.agentId).name}
            role={agentOf(openSlip.agentId).role}
            pct={(() => {
              const profit = openSlip.commissionBookings.reduce(
                (n, b) => n + b.profit,
                0,
              );
              return profit
                ? Math.round((openSlip.commission / profit) * 1000) / 10
                : (agentOf(openSlip.agentId).commissionPct ?? 0);
            })()}
            period={period}
          />
        )}
      </Modal>

      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title={`Approve payday ${period.label}?`}
        description={`${slips.length} payslips, ${money(total("net"))} take-home in total. Payslips are locked after approval.`}
      >
        <div className="dialog-actions">
          <Button variant="outline" onClick={() => setConfirm(false)}>
            Not yet
          </Button>
          <Button
            onClick={() => {
              notify(
                () => s.approvePayday(period.key, live),
                "Payday approved. Payslips locked.",
              );
              setConfirm(false);
            }}
          >
            Approve payday
          </Button>
        </div>
      </Modal>

      <Modal
        open={advance}
        onOpenChange={setAdvance}
        title="Record a cash advance"
        description="It's deducted on this payday's payslip."
      >
        <form
          className="section-stack"
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            notify(() => {
              s.addCashAdvance(
                String(d.get("agent")),
                centavos(String(d.get("amount"))),
                String(d.get("note") ?? ""),
              );
              setAdvance(false);
            }, "Cash advance recorded");
          }}
        >
          <Field label="Staff">
            <select name="agent" aria-label="Advance staff">
              {staff.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount (PHP)">
            <Input
              name="amount"
              aria-label="Advance amount"
              type="number"
              min="1"
              step="1"
              required
            />
          </Field>
          <Field label="Note">
            <Input name="note" aria-label="Advance note" />
          </Field>
          <div className="dialog-actions">
            <Button type="submit">Save advance</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
