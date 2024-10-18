-- Table: public.debt

-- DROP TABLE IF EXISTS public.debt;

CREATE TABLE IF NOT EXISTS public.debt
(
    summary text COLLATE pg_catalog."default",
    id uuid NOT NULL,
    balance double precision,
    interest double precision,
    account_number text COLLATE pg_catalog."default",
    link text COLLATE pg_catalog."default",
    user_id uuid,
    CONSTRAINT debt_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.debt
    OWNER to postgres;

-- Table: public.event

-- DROP TABLE IF EXISTS public.event;

CREATE TABLE IF NOT EXISTS public.event
(
    id uuid NOT NULL,
    recurrenceid uuid,
    summary text COLLATE pg_catalog."default",
    date date NOT NULL,
    recurrenceenddate date,
    amount integer NOT NULL DEFAULT 0,
    total integer,
    balance integer,
    exclude bit(1),
    frequency character varying(255) COLLATE pg_catalog."default",
    user_id uuid,
    CONSTRAINT event_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.event
    OWNER to postgres;


-- Table: public.event_field_lock

-- DROP TABLE IF EXISTS public.event_field_lock;

CREATE TABLE IF NOT EXISTS public.event_field_lock
(
    id uuid NOT NULL,
    user uuid,
    event_id uuid NOT NULL,
    field_name character varying(100) COLLATE pg_catalog."default"
    CONSTRAINT event_field_lock_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.event
    OWNER to postgres;


-- Table: public.expense

-- DROP TABLE IF EXISTS public.expense;

CREATE TABLE IF NOT EXISTS public.expense
(
    id uuid NOT NULL,
    name character varying(255) COLLATE pg_catalog."default",
    amount integer,
    recurrenceenddate date,
    startdate date,
    user_id uuid,
    frequency character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT expense_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.expense
    OWNER to postgres;

-- Table: public.user

-- DROP TABLE IF EXISTS public."user";

CREATE TABLE IF NOT EXISTS public."user"
(
    id uuid NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    password text COLLATE pg_catalog."default" NOT NULL,
    checking_balance double precision NOT NULL DEFAULT 0.0,
    CONSTRAINT user_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."user"
    OWNER to postgres;