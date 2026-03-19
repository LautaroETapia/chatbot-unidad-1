create extension if not exists pgcrypto;

create table if not exists public.chat_messages (
	id uuid primary key default gen_random_uuid(),
	user_id uuid,
	conversation_id text not null,
	role text not null check (role in ('user', 'assistant')),
	content text not null,
	created_at timestamptz not null default now()
);

alter table public.chat_messages
	add column if not exists user_id uuid;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'chat_messages_user_id_fkey'
	) then
		alter table public.chat_messages
			add constraint chat_messages_user_id_fkey
			foreign key (user_id)
			references auth.users(id)
			on delete cascade;
	end if;
end
$$;

create index if not exists chat_messages_conversation_created_idx
	on public.chat_messages (conversation_id, created_at);

create index if not exists chat_messages_user_conversation_created_idx
	on public.chat_messages (user_id, conversation_id, created_at);
