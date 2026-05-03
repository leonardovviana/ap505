alter table public.incomes
drop constraint if exists incomes_kind_check;

alter table public.incomes
add constraint incomes_kind_check
check (kind in ('salary', 'extra', 'food_voucher'));
