--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5.4
-- Dumped by pg_dump version 9.5.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: action_history; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE action_history (
    id integer NOT NULL,
    uuid uuid,
    type character varying(255),
    status character varying(255),
    params jsonb,
    result jsonb,
    user_id integer,
    elapsed integer,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE action_history OWNER TO serverboards;

--
-- Name: action_history_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE action_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE action_history_id_seq OWNER TO serverboards;

--
-- Name: action_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE action_history_id_seq OWNED BY action_history.id;


--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE auth_group (
    id integer NOT NULL,
    name character varying(255)
);


ALTER TABLE auth_group OWNER TO serverboards;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE auth_group_id_seq OWNER TO serverboards;

--
-- Name: auth_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE auth_group_id_seq OWNED BY auth_group.id;


--
-- Name: auth_group_perms; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE auth_group_perms (
    id integer NOT NULL,
    group_id integer,
    perm_id integer
);


ALTER TABLE auth_group_perms OWNER TO serverboards;

--
-- Name: auth_group_perms_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE auth_group_perms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE auth_group_perms_id_seq OWNER TO serverboards;

--
-- Name: auth_group_perms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE auth_group_perms_id_seq OWNED BY auth_group_perms.id;


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE auth_permission (
    id integer NOT NULL,
    code character varying(255)
);


ALTER TABLE auth_permission OWNER TO serverboards;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE auth_permission_id_seq OWNER TO serverboards;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE auth_permission_id_seq OWNED BY auth_permission.id;


--
-- Name: auth_user; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE auth_user (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255),
    is_active boolean,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE auth_user OWNER TO serverboards;

--
-- Name: auth_user_group; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE auth_user_group (
    id integer NOT NULL,
    user_id integer,
    group_id integer
);


ALTER TABLE auth_user_group OWNER TO serverboards;

--
-- Name: auth_user_group_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE auth_user_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE auth_user_group_id_seq OWNER TO serverboards;

--
-- Name: auth_user_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE auth_user_group_id_seq OWNED BY auth_user_group.id;


--
-- Name: auth_user_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE auth_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE auth_user_id_seq OWNER TO serverboards;

--
-- Name: auth_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE auth_user_id_seq OWNED BY auth_user.id;


--
-- Name: auth_user_password; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE auth_user_password (
    id integer NOT NULL,
    password character varying(255),
    user_id integer,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE auth_user_password OWNER TO serverboards;

--
-- Name: auth_user_password_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE auth_user_password_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE auth_user_password_id_seq OWNER TO serverboards;

--
-- Name: auth_user_password_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE auth_user_password_id_seq OWNED BY auth_user_password.id;


--
-- Name: auth_user_token; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE auth_user_token (
    id integer NOT NULL,
    user_id integer,
    token character varying(255),
    perms character varying(255)[],
    time_limit timestamp without time zone,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE auth_user_token OWNER TO serverboards;

--
-- Name: auth_user_token_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE auth_user_token_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE auth_user_token_id_seq OWNER TO serverboards;

--
-- Name: auth_user_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE auth_user_token_id_seq OWNED BY auth_user_token.id;


--
-- Name: eventsourcing_event_stream; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE eventsourcing_event_stream (
    id integer NOT NULL,
    store character varying(255),
    type character varying(255),
    author character varying(255),
    data jsonb,
    inserted_at timestamp without time zone
);


ALTER TABLE eventsourcing_event_stream OWNER TO serverboards;

--
-- Name: eventsourcing_event_stream_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE eventsourcing_event_stream_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE eventsourcing_event_stream_id_seq OWNER TO serverboards;

--
-- Name: eventsourcing_event_stream_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE eventsourcing_event_stream_id_seq OWNED BY eventsourcing_event_stream.id;


--
-- Name: logger_line; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE logger_line (
    id integer NOT NULL,
    message text,
    level character varying(255),
    "timestamp" timestamp without time zone,
    meta jsonb
);


ALTER TABLE logger_line OWNER TO serverboards;

--
-- Name: logger_line_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE logger_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE logger_line_id_seq OWNER TO serverboards;

--
-- Name: logger_line_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE logger_line_id_seq OWNED BY logger_line.id;


--
-- Name: notifications_channelconfig; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE notifications_channelconfig (
    id integer NOT NULL,
    user_id integer,
    is_active boolean,
    channel character varying(255),
    config jsonb,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE notifications_channelconfig OWNER TO serverboards;

--
-- Name: notifications_channelconfig_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE notifications_channelconfig_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE notifications_channelconfig_id_seq OWNER TO serverboards;

--
-- Name: notifications_channelconfig_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE notifications_channelconfig_id_seq OWNED BY notifications_channelconfig.id;


--
-- Name: notifications_notification; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE notifications_notification (
    id integer NOT NULL,
    user_id integer,
    subject character varying(255),
    body character varying(1024),
    meta jsonb,
    tags character varying(255)[],
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE notifications_notification OWNER TO serverboards;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE notifications_notification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE notifications_notification_id_seq OWNER TO serverboards;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE notifications_notification_id_seq OWNED BY notifications_notification.id;


--
-- Name: plugin_data; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE plugin_data (
    id integer NOT NULL,
    plugin character varying(255),
    key character varying(255),
    value jsonb,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE plugin_data OWNER TO serverboards;

--
-- Name: plugin_data_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE plugin_data_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE plugin_data_id_seq OWNER TO serverboards;

--
-- Name: plugin_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE plugin_data_id_seq OWNED BY plugin_data.id;


--
-- Name: rules_action_state; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE rules_action_state (
    id integer NOT NULL,
    rule_id integer,
    state character varying(255),
    action character varying(255),
    params jsonb
);


ALTER TABLE rules_action_state OWNER TO serverboards;

--
-- Name: rules_action_state_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE rules_action_state_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE rules_action_state_id_seq OWNER TO serverboards;

--
-- Name: rules_action_state_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE rules_action_state_id_seq OWNED BY rules_action_state.id;


--
-- Name: rules_rule; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE rules_rule (
    id integer NOT NULL,
    uuid uuid,
    is_active boolean,
    name character varying(255),
    description character varying(255),
    serverboard_id integer,
    service_id integer,
    trigger character varying(255),
    params jsonb,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    from_template character varying(256)
);


ALTER TABLE rules_rule OWNER TO serverboards;

--
-- Name: rules_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE rules_rule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE rules_rule_id_seq OWNER TO serverboards;

--
-- Name: rules_rule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE rules_rule_id_seq OWNED BY rules_rule.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp without time zone
);


ALTER TABLE schema_migrations OWNER TO serverboards;

--
-- Name: serverboard_serverboard; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE serverboard_serverboard (
    id integer NOT NULL,
    shortname character varying(255),
    name character varying(255),
    description character varying(255),
    creator_id integer,
    priority integer,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE serverboard_serverboard OWNER TO serverboards;

--
-- Name: serverboard_serverboard_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE serverboard_serverboard_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE serverboard_serverboard_id_seq OWNER TO serverboards;

--
-- Name: serverboard_serverboard_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE serverboard_serverboard_id_seq OWNED BY serverboard_serverboard.id;


--
-- Name: serverboard_serverboard_service; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE serverboard_serverboard_service (
    id integer NOT NULL,
    serverboard_id integer,
    service_id integer,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE serverboard_serverboard_service OWNER TO serverboards;

--
-- Name: serverboard_serverboard_service_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE serverboard_serverboard_service_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE serverboard_serverboard_service_id_seq OWNER TO serverboards;

--
-- Name: serverboard_serverboard_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE serverboard_serverboard_service_id_seq OWNED BY serverboard_serverboard_service.id;


--
-- Name: serverboard_serverboard_tag; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE serverboard_serverboard_tag (
    id integer NOT NULL,
    serverboard_id integer,
    name character varying(255)
);


ALTER TABLE serverboard_serverboard_tag OWNER TO serverboards;

--
-- Name: serverboard_serverboard_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE serverboard_serverboard_tag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE serverboard_serverboard_tag_id_seq OWNER TO serverboards;

--
-- Name: serverboard_serverboard_tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE serverboard_serverboard_tag_id_seq OWNED BY serverboard_serverboard_tag.id;


--
-- Name: serverboard_widget; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE serverboard_widget (
    id integer NOT NULL,
    serverboard_id integer,
    uuid uuid,
    widget character varying(255),
    config jsonb,
    ui jsonb,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE serverboard_widget OWNER TO serverboards;

--
-- Name: serverboard_widget_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE serverboard_widget_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE serverboard_widget_id_seq OWNER TO serverboards;

--
-- Name: serverboard_widget_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE serverboard_widget_id_seq OWNED BY serverboard_widget.id;


--
-- Name: service_service; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE service_service (
    id integer NOT NULL,
    uuid uuid,
    name character varying(255),
    type character varying(255),
    creator_id integer,
    priority integer,
    config jsonb,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    description character varying(1024)
);


ALTER TABLE service_service OWNER TO serverboards;

--
-- Name: service_service_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE service_service_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE service_service_id_seq OWNER TO serverboards;

--
-- Name: service_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE service_service_id_seq OWNED BY service_service.id;


--
-- Name: service_service_tag; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE service_service_tag (
    id integer NOT NULL,
    service_id integer,
    name character varying(255)
);


ALTER TABLE service_service_tag OWNER TO serverboards;

--
-- Name: service_service_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE service_service_tag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE service_service_tag_id_seq OWNER TO serverboards;

--
-- Name: service_service_tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE service_service_tag_id_seq OWNED BY service_service_tag.id;


--
-- Name: settings_settings; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE settings_settings (
    id integer NOT NULL,
    section character varying(255),
    data jsonb,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE settings_settings OWNER TO serverboards;

--
-- Name: settings_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE settings_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE settings_settings_id_seq OWNER TO serverboards;

--
-- Name: settings_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE settings_settings_id_seq OWNED BY settings_settings.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY action_history ALTER COLUMN id SET DEFAULT nextval('action_history_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_group ALTER COLUMN id SET DEFAULT nextval('auth_group_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_group_perms ALTER COLUMN id SET DEFAULT nextval('auth_group_perms_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_permission ALTER COLUMN id SET DEFAULT nextval('auth_permission_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user ALTER COLUMN id SET DEFAULT nextval('auth_user_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_group ALTER COLUMN id SET DEFAULT nextval('auth_user_group_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_password ALTER COLUMN id SET DEFAULT nextval('auth_user_password_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_token ALTER COLUMN id SET DEFAULT nextval('auth_user_token_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY eventsourcing_event_stream ALTER COLUMN id SET DEFAULT nextval('eventsourcing_event_stream_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY logger_line ALTER COLUMN id SET DEFAULT nextval('logger_line_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY notifications_channelconfig ALTER COLUMN id SET DEFAULT nextval('notifications_channelconfig_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY notifications_notification ALTER COLUMN id SET DEFAULT nextval('notifications_notification_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY plugin_data ALTER COLUMN id SET DEFAULT nextval('plugin_data_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY rules_action_state ALTER COLUMN id SET DEFAULT nextval('rules_action_state_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY rules_rule ALTER COLUMN id SET DEFAULT nextval('rules_rule_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY serverboard_serverboard ALTER COLUMN id SET DEFAULT nextval('serverboard_serverboard_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY serverboard_serverboard_service ALTER COLUMN id SET DEFAULT nextval('serverboard_serverboard_service_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY serverboard_serverboard_tag ALTER COLUMN id SET DEFAULT nextval('serverboard_serverboard_tag_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY serverboard_widget ALTER COLUMN id SET DEFAULT nextval('serverboard_widget_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY service_service ALTER COLUMN id SET DEFAULT nextval('service_service_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY service_service_tag ALTER COLUMN id SET DEFAULT nextval('service_service_tag_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY settings_settings ALTER COLUMN id SET DEFAULT nextval('settings_settings_id_seq'::regclass);


--
-- Name: action_history_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY action_history
    ADD CONSTRAINT action_history_pkey PRIMARY KEY (id);


--
-- Name: auth_group_perms_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_group_perms
    ADD CONSTRAINT auth_group_perms_pkey PRIMARY KEY (id);


--
-- Name: auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: auth_user_group_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_group
    ADD CONSTRAINT auth_user_group_pkey PRIMARY KEY (id);


--
-- Name: auth_user_password_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_password
    ADD CONSTRAINT auth_user_password_pkey PRIMARY KEY (id);


--
-- Name: auth_user_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user
    ADD CONSTRAINT auth_user_pkey PRIMARY KEY (id);


--
-- Name: auth_user_token_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_token
    ADD CONSTRAINT auth_user_token_pkey PRIMARY KEY (id);


--
-- Name: eventsourcing_event_stream_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY eventsourcing_event_stream
    ADD CONSTRAINT eventsourcing_event_stream_pkey PRIMARY KEY (id);


--
-- Name: logger_line_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY logger_line
    ADD CONSTRAINT logger_line_pkey PRIMARY KEY (id);


--
-- Name: notifications_channelconfig_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY notifications_channelconfig
    ADD CONSTRAINT notifications_channelconfig_pkey PRIMARY KEY (id);


--
-- Name: notifications_notification_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY notifications_notification
    ADD CONSTRAINT notifications_notification_pkey PRIMARY KEY (id);


--
-- Name: plugin_data_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY plugin_data
    ADD CONSTRAINT plugin_data_pkey PRIMARY KEY (id);


--
-- Name: rules_action_state_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY rules_action_state
    ADD CONSTRAINT rules_action_state_pkey PRIMARY KEY (id);


--
-- Name: rules_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY rules_rule
    ADD CONSTRAINT rules_rule_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: serverboard_serverboard_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY serverboard_serverboard
    ADD CONSTRAINT serverboard_serverboard_pkey PRIMARY KEY (id);


--
-- Name: serverboard_serverboard_service_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY serverboard_serverboard_service
    ADD CONSTRAINT serverboard_serverboard_service_pkey PRIMARY KEY (id);


--
-- Name: serverboard_serverboard_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY serverboard_serverboard_tag
    ADD CONSTRAINT serverboard_serverboard_tag_pkey PRIMARY KEY (id);


--
-- Name: serverboard_widget_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY serverboard_widget
    ADD CONSTRAINT serverboard_widget_pkey PRIMARY KEY (id);


--
-- Name: service_service_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY service_service
    ADD CONSTRAINT service_service_pkey PRIMARY KEY (id);


--
-- Name: service_service_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY service_service_tag
    ADD CONSTRAINT service_service_tag_pkey PRIMARY KEY (id);


--
-- Name: settings_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY settings_settings
    ADD CONSTRAINT settings_settings_pkey PRIMARY KEY (id);


--
-- Name: action_history_status_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX action_history_status_index ON action_history USING btree (status);


--
-- Name: action_history_type_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX action_history_type_index ON action_history USING btree (type);


--
-- Name: action_history_user_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX action_history_user_id_index ON action_history USING btree (user_id);


--
-- Name: action_history_uuid_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX action_history_uuid_index ON action_history USING btree (uuid);


--
-- Name: auth_group_name_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX auth_group_name_index ON auth_group USING btree (name);


--
-- Name: auth_group_perms_group_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX auth_group_perms_group_id_index ON auth_group_perms USING btree (group_id);


--
-- Name: auth_group_perms_group_id_perm_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX auth_group_perms_group_id_perm_id_index ON auth_group_perms USING btree (group_id, perm_id);


--
-- Name: auth_group_perms_perm_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX auth_group_perms_perm_id_index ON auth_group_perms USING btree (perm_id);


--
-- Name: auth_permission_code_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX auth_permission_code_index ON auth_permission USING btree (code);


--
-- Name: auth_user_email_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX auth_user_email_index ON auth_user USING btree (email);


--
-- Name: auth_user_group_group_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX auth_user_group_group_id_index ON auth_user_group USING btree (group_id);


--
-- Name: auth_user_group_user_id_group_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX auth_user_group_user_id_group_id_index ON auth_user_group USING btree (user_id, group_id);


--
-- Name: auth_user_group_user_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX auth_user_group_user_id_index ON auth_user_group USING btree (user_id);


--
-- Name: auth_user_password_user_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX auth_user_password_user_id_index ON auth_user_password USING btree (user_id);


--
-- Name: auth_user_token_time_limit_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX auth_user_token_time_limit_index ON auth_user_token USING btree (time_limit);


--
-- Name: auth_user_token_token_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX auth_user_token_token_index ON auth_user_token USING btree (token);


--
-- Name: auth_user_token_user_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX auth_user_token_user_id_index ON auth_user_token USING btree (user_id);


--
-- Name: eventsourcing_event_stream_store_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX eventsourcing_event_stream_store_index ON eventsourcing_event_stream USING btree (store);


--
-- Name: eventsourcing_event_stream_type_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX eventsourcing_event_stream_type_index ON eventsourcing_event_stream USING btree (type);


--
-- Name: logger_line_level_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX logger_line_level_index ON logger_line USING btree (level);


--
-- Name: logger_line_timestamp_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX logger_line_timestamp_index ON logger_line USING btree ("timestamp");


--
-- Name: logger_line_timestamp_level_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX logger_line_timestamp_level_index ON logger_line USING btree ("timestamp", level);


--
-- Name: notifications_channelconfig_channel_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX notifications_channelconfig_channel_index ON notifications_channelconfig USING btree (channel);


--
-- Name: notifications_channelconfig_user_id_channel_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX notifications_channelconfig_user_id_channel_index ON notifications_channelconfig USING btree (user_id, channel);


--
-- Name: notifications_channelconfig_user_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX notifications_channelconfig_user_id_index ON notifications_channelconfig USING btree (user_id);


--
-- Name: notifications_channelconfig_user_id_is_active_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX notifications_channelconfig_user_id_is_active_index ON notifications_channelconfig USING btree (user_id, is_active);


--
-- Name: notifications_notification_tags_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX notifications_notification_tags_index ON notifications_notification USING gin (tags);


--
-- Name: notifications_notification_user_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX notifications_notification_user_id_index ON notifications_notification USING btree (user_id);


--
-- Name: plugin_data_key_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX plugin_data_key_index ON plugin_data USING btree (key);


--
-- Name: plugin_data_plugin_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX plugin_data_plugin_index ON plugin_data USING btree (plugin);


--
-- Name: plugin_data_plugin_key_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX plugin_data_plugin_key_index ON plugin_data USING btree (plugin, key);


--
-- Name: rules_action_state_rule_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX rules_action_state_rule_id_index ON rules_action_state USING btree (rule_id);


--
-- Name: rules_action_state_rule_id_state_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX rules_action_state_rule_id_state_index ON rules_action_state USING btree (rule_id, state);


--
-- Name: rules_rule_is_active_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX rules_rule_is_active_index ON rules_rule USING btree (is_active);


--
-- Name: rules_rule_serverboard_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX rules_rule_serverboard_id_index ON rules_rule USING btree (serverboard_id);


--
-- Name: rules_rule_uuid_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX rules_rule_uuid_index ON rules_rule USING btree (uuid);


--
-- Name: serverboard_serverboard_priority_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX serverboard_serverboard_priority_index ON serverboard_serverboard USING btree (priority);


--
-- Name: serverboard_serverboard_service_serverboard_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX serverboard_serverboard_service_serverboard_id_index ON serverboard_serverboard_service USING btree (serverboard_id);


--
-- Name: serverboard_serverboard_service_service_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX serverboard_serverboard_service_service_id_index ON serverboard_serverboard_service USING btree (service_id);


--
-- Name: serverboard_serverboard_shortname_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX serverboard_serverboard_shortname_index ON serverboard_serverboard USING btree (shortname);


--
-- Name: serverboard_serverboard_tag_serverboard_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX serverboard_serverboard_tag_serverboard_id_index ON serverboard_serverboard_tag USING btree (serverboard_id);


--
-- Name: serverboard_widget_serverboard_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX serverboard_widget_serverboard_id_index ON serverboard_widget USING btree (serverboard_id);


--
-- Name: serverboard_widget_uuid_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX serverboard_widget_uuid_index ON serverboard_widget USING btree (uuid);


--
-- Name: service_service_tag_service_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX service_service_tag_service_id_index ON service_service_tag USING btree (service_id);


--
-- Name: service_service_tag_service_id_name_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX service_service_tag_service_id_name_index ON service_service_tag USING btree (service_id, name);


--
-- Name: service_service_type_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX service_service_type_index ON service_service USING btree (type);


--
-- Name: service_service_uuid_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX service_service_uuid_index ON service_service USING btree (uuid);


--
-- Name: settings_settings_section_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX settings_settings_section_index ON settings_settings USING btree (section);


--
-- Name: auth_group_perms_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_group_perms
    ADD CONSTRAINT auth_group_perms_group_id_fkey FOREIGN KEY (group_id) REFERENCES auth_group(id);


--
-- Name: auth_group_perms_perm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_group_perms
    ADD CONSTRAINT auth_group_perms_perm_id_fkey FOREIGN KEY (perm_id) REFERENCES auth_permission(id);


--
-- Name: auth_user_group_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_group
    ADD CONSTRAINT auth_user_group_group_id_fkey FOREIGN KEY (group_id) REFERENCES auth_group(id);


--
-- Name: auth_user_group_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_group
    ADD CONSTRAINT auth_user_group_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth_user(id);


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: serverboards
--

COPY schema_migrations (version, inserted_at) FROM stdin;
20160314154348	2016-08-02 14:10:48
20160405085306	2016-08-02 14:10:48
20160425101237	2016-08-02 14:10:48
20160428164310	2016-08-02 14:10:48
20160523115207	2016-08-02 14:10:48
20160527163130	2016-08-02 14:10:48
20160615111151	2016-08-02 14:10:48
20160620094318	2016-08-02 14:10:49
20160623110443	2016-08-02 14:10:49
20160711162212	2016-08-02 14:10:49
20160722074911	2016-08-02 14:10:49
20160722104205	2016-08-02 14:10:49
20160722104829	2016-08-02 14:10:49
20160726112621	2016-08-02 14:10:49
20160817200742	2016-08-17 20:11:01
20160819125319	2016-08-19 12:54:22
\.

--
-- PostgreSQL database dump complete
--
