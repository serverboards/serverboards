--
-- PostgreSQL database dump
--

-- Dumped from database version 9.6.3
-- Dumped by pg_dump version 9.6.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


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
-- Name: issues_aliases; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE issues_aliases (
    id integer NOT NULL,
    issue_id integer,
    alias character varying(256)
);


ALTER TABLE issues_aliases OWNER TO serverboards;

--
-- Name: issues_aliases_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE issues_aliases_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE issues_aliases_id_seq OWNER TO serverboards;

--
-- Name: issues_aliases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE issues_aliases_id_seq OWNED BY issues_aliases.id;


--
-- Name: issues_event; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE issues_event (
    id integer NOT NULL,
    issue_id integer,
    creator_id integer,
    type character varying(16),
    data jsonb,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE issues_event OWNER TO serverboards;

--
-- Name: issues_event_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE issues_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE issues_event_id_seq OWNER TO serverboards;

--
-- Name: issues_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE issues_event_id_seq OWNED BY issues_event.id;


--
-- Name: issues_issue; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE issues_issue (
    id integer NOT NULL,
    creator_id integer,
    title character varying(256),
    status character varying(16),
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE issues_issue OWNER TO serverboards;

--
-- Name: issues_issue_assignee; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE issues_issue_assignee (
    id integer NOT NULL,
    issue_id integer,
    user_id integer,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE issues_issue_assignee OWNER TO serverboards;

--
-- Name: issues_issue_assignee_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE issues_issue_assignee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE issues_issue_assignee_id_seq OWNER TO serverboards;

--
-- Name: issues_issue_assignee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE issues_issue_assignee_id_seq OWNED BY issues_issue_assignee.id;


--
-- Name: issues_issue_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE issues_issue_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE issues_issue_id_seq OWNER TO serverboards;

--
-- Name: issues_issue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE issues_issue_id_seq OWNED BY issues_issue.id;


--
-- Name: issues_issue_label; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE issues_issue_label (
    id integer NOT NULL,
    issue_id integer,
    label_id integer
);


ALTER TABLE issues_issue_label OWNER TO serverboards;

--
-- Name: issues_issue_label_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE issues_issue_label_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE issues_issue_label_id_seq OWNER TO serverboards;

--
-- Name: issues_issue_label_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE issues_issue_label_id_seq OWNED BY issues_issue_label.id;


--
-- Name: issues_label; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE issues_label (
    id integer NOT NULL,
    name character varying(16),
    color character varying(16)
);


ALTER TABLE issues_label OWNER TO serverboards;

--
-- Name: issues_label_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE issues_label_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE issues_label_id_seq OWNER TO serverboards;

--
-- Name: issues_label_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE issues_label_id_seq OWNED BY issues_label.id;


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
    body text,
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
-- Name: perms_acl; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE perms_acl (
    id integer NOT NULL,
    role character varying(255),
    role_id integer,
    object_type character varying(255),
    object character varying(255),
    object_id integer,
    permission character varying(255)
);


ALTER TABLE perms_acl OWNER TO serverboards;

--
-- Name: perms_acl_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE perms_acl_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE perms_acl_id_seq OWNER TO serverboards;

--
-- Name: perms_acl_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE perms_acl_id_seq OWNED BY perms_acl.id;


--
-- Name: perms_user_perm; Type: VIEW; Schema: public; Owner: dmoreno
--

CREATE VIEW perms_user_perm AS
 SELECT DISTINCT u.id AS user_id,
    u.email,
    acl.object_type,
    acl.object,
    acl.object_id,
    acl.permission
   FROM (((auth_user u
     LEFT JOIN auth_user_group ug ON ((ug.user_id = u.id)))
     LEFT JOIN auth_group g ON ((g.id = ug.group_id)))
     JOIN perms_acl acl ON ((((acl.role_id = g.id) AND ((acl.role)::text = 'group'::text)) OR ((acl.role_id = u.id) AND ((acl.role)::text = 'user'::text)) OR ((acl.role)::text = 'other'::text))));


ALTER TABLE perms_user_perm OWNER TO dmoreno;

--
-- Name: perms_user_perm_self; Type: VIEW; Schema: public; Owner: dmoreno
--

CREATE VIEW perms_user_perm_self AS
 SELECT DISTINCT u.id AS user_id,
    u.email,
    acl.role,
    acl.object_type,
    acl.object,
    acl.object_id,
    acl.permission
   FROM (((auth_user u
     LEFT JOIN auth_user_group ug ON ((ug.user_id = u.id)))
     LEFT JOIN auth_group g ON ((g.id = ug.group_id)))
     JOIN perms_acl acl ON ((((acl.role_id = g.id) AND ((acl.role)::text = 'group'::text)) OR ((acl.role_id = u.id) AND ((acl.role)::text = 'user'::text)) OR ((acl.role)::text = 'other'::text) OR ((acl.role)::text = 'self'::text))));


ALTER TABLE perms_user_perm_self OWNER TO dmoreno;

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
-- Name: project_dashboard; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE project_dashboard (
    id integer NOT NULL,
    uuid uuid,
    project_id integer,
    name character varying(255),
    "order" integer DEFAULT 0,
    config jsonb,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE project_dashboard OWNER TO serverboards;

--
-- Name: project_dashboard_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE project_dashboard_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE project_dashboard_id_seq OWNER TO serverboards;

--
-- Name: project_dashboard_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE project_dashboard_id_seq OWNED BY project_dashboard.id;


--
-- Name: project_project; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE project_project (
    id integer NOT NULL,
    shortname character varying(255),
    name character varying(255),
    description character varying(255),
    creator_id integer,
    priority integer,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE project_project OWNER TO serverboards;

--
-- Name: project_project_service; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE project_project_service (
    id integer NOT NULL,
    project_id integer,
    service_id integer,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE project_project_service OWNER TO serverboards;

--
-- Name: project_project_tag; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE project_project_tag (
    id integer NOT NULL,
    project_id integer,
    name character varying(255)
);


ALTER TABLE project_project_tag OWNER TO serverboards;

--
-- Name: project_widget; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE project_widget (
    id integer NOT NULL,
    uuid uuid,
    widget character varying(255),
    config jsonb,
    ui jsonb,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    dashboard_id integer
);


ALTER TABLE project_widget OWNER TO serverboards;

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
    project_id integer,
    service_id integer,
    trigger character varying(255),
    params jsonb,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    from_template character varying(256),
    last_state character varying(256),
    deleted boolean DEFAULT false
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
-- Name: rules_v2_rule; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE rules_v2_rule (
    id integer NOT NULL,
    uuid uuid,
    is_active boolean,
    deleted boolean,
    name character varying,
    description text,
    project_id integer,
    rule jsonb,
    from_template character varying(255),
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE rules_v2_rule OWNER TO serverboards;

--
-- Name: rules_v2_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE rules_v2_rule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE rules_v2_rule_id_seq OWNER TO serverboards;

--
-- Name: rules_v2_rule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE rules_v2_rule_id_seq OWNED BY rules_v2_rule.id;


--
-- Name: rules_v2_rule_state; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE rules_v2_rule_state (
    id integer NOT NULL,
    rule_id integer,
    state jsonb,
    inserted_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE rules_v2_rule_state OWNER TO serverboards;

--
-- Name: rules_v2_rule_state_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE rules_v2_rule_state_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE rules_v2_rule_state_id_seq OWNER TO serverboards;

--
-- Name: rules_v2_rule_state_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE rules_v2_rule_state_id_seq OWNED BY rules_v2_rule_state.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp without time zone
);


ALTER TABLE schema_migrations OWNER TO serverboards;

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

ALTER SEQUENCE serverboard_serverboard_id_seq OWNED BY project_project.id;


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

ALTER SEQUENCE serverboard_serverboard_service_id_seq OWNED BY project_project_service.id;


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

ALTER SEQUENCE serverboard_serverboard_tag_id_seq OWNED BY project_project_tag.id;


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

ALTER SEQUENCE serverboard_widget_id_seq OWNED BY project_widget.id;


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
-- Name: settings_user_settings; Type: TABLE; Schema: public; Owner: serverboards
--

CREATE TABLE settings_user_settings (
    id integer NOT NULL,
    section text,
    user_id integer,
    data jsonb,
    inserted_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE settings_user_settings OWNER TO serverboards;

--
-- Name: settings_user_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: serverboards
--

CREATE SEQUENCE settings_user_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE settings_user_settings_id_seq OWNER TO serverboards;

--
-- Name: settings_user_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: serverboards
--

ALTER SEQUENCE settings_user_settings_id_seq OWNED BY settings_user_settings.id;


--
-- Name: action_history id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY action_history ALTER COLUMN id SET DEFAULT nextval('action_history_id_seq'::regclass);


--
-- Name: auth_group id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_group ALTER COLUMN id SET DEFAULT nextval('auth_group_id_seq'::regclass);


--
-- Name: auth_group_perms id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_group_perms ALTER COLUMN id SET DEFAULT nextval('auth_group_perms_id_seq'::regclass);


--
-- Name: auth_permission id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_permission ALTER COLUMN id SET DEFAULT nextval('auth_permission_id_seq'::regclass);


--
-- Name: auth_user id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user ALTER COLUMN id SET DEFAULT nextval('auth_user_id_seq'::regclass);


--
-- Name: auth_user_group id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_group ALTER COLUMN id SET DEFAULT nextval('auth_user_group_id_seq'::regclass);


--
-- Name: auth_user_password id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_password ALTER COLUMN id SET DEFAULT nextval('auth_user_password_id_seq'::regclass);


--
-- Name: auth_user_token id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_token ALTER COLUMN id SET DEFAULT nextval('auth_user_token_id_seq'::regclass);


--
-- Name: eventsourcing_event_stream id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY eventsourcing_event_stream ALTER COLUMN id SET DEFAULT nextval('eventsourcing_event_stream_id_seq'::regclass);


--
-- Name: issues_aliases id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY issues_aliases ALTER COLUMN id SET DEFAULT nextval('issues_aliases_id_seq'::regclass);


--
-- Name: issues_event id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY issues_event ALTER COLUMN id SET DEFAULT nextval('issues_event_id_seq'::regclass);


--
-- Name: issues_issue id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY issues_issue ALTER COLUMN id SET DEFAULT nextval('issues_issue_id_seq'::regclass);


--
-- Name: issues_issue_assignee id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY issues_issue_assignee ALTER COLUMN id SET DEFAULT nextval('issues_issue_assignee_id_seq'::regclass);


--
-- Name: issues_issue_label id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY issues_issue_label ALTER COLUMN id SET DEFAULT nextval('issues_issue_label_id_seq'::regclass);


--
-- Name: issues_label id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY issues_label ALTER COLUMN id SET DEFAULT nextval('issues_label_id_seq'::regclass);


--
-- Name: logger_line id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY logger_line ALTER COLUMN id SET DEFAULT nextval('logger_line_id_seq'::regclass);


--
-- Name: notifications_channelconfig id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY notifications_channelconfig ALTER COLUMN id SET DEFAULT nextval('notifications_channelconfig_id_seq'::regclass);


--
-- Name: notifications_notification id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY notifications_notification ALTER COLUMN id SET DEFAULT nextval('notifications_notification_id_seq'::regclass);


--
-- Name: perms_acl id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY perms_acl ALTER COLUMN id SET DEFAULT nextval('perms_acl_id_seq'::regclass);


--
-- Name: plugin_data id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY plugin_data ALTER COLUMN id SET DEFAULT nextval('plugin_data_id_seq'::regclass);


--
-- Name: project_dashboard id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY project_dashboard ALTER COLUMN id SET DEFAULT nextval('project_dashboard_id_seq'::regclass);


--
-- Name: project_project id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY project_project ALTER COLUMN id SET DEFAULT nextval('serverboard_serverboard_id_seq'::regclass);


--
-- Name: project_project_service id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY project_project_service ALTER COLUMN id SET DEFAULT nextval('serverboard_serverboard_service_id_seq'::regclass);


--
-- Name: project_project_tag id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY project_project_tag ALTER COLUMN id SET DEFAULT nextval('serverboard_serverboard_tag_id_seq'::regclass);


--
-- Name: project_widget id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY project_widget ALTER COLUMN id SET DEFAULT nextval('serverboard_widget_id_seq'::regclass);


--
-- Name: rules_action_state id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY rules_action_state ALTER COLUMN id SET DEFAULT nextval('rules_action_state_id_seq'::regclass);


--
-- Name: rules_rule id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY rules_rule ALTER COLUMN id SET DEFAULT nextval('rules_rule_id_seq'::regclass);


--
-- Name: rules_v2_rule id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY rules_v2_rule ALTER COLUMN id SET DEFAULT nextval('rules_v2_rule_id_seq'::regclass);


--
-- Name: rules_v2_rule_state id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY rules_v2_rule_state ALTER COLUMN id SET DEFAULT nextval('rules_v2_rule_state_id_seq'::regclass);


--
-- Name: service_service id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY service_service ALTER COLUMN id SET DEFAULT nextval('service_service_id_seq'::regclass);


--
-- Name: service_service_tag id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY service_service_tag ALTER COLUMN id SET DEFAULT nextval('service_service_tag_id_seq'::regclass);


--
-- Name: settings_settings id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY settings_settings ALTER COLUMN id SET DEFAULT nextval('settings_settings_id_seq'::regclass);


--
-- Name: settings_user_settings id; Type: DEFAULT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY settings_user_settings ALTER COLUMN id SET DEFAULT nextval('settings_user_settings_id_seq'::regclass);


--
-- Name: action_history action_history_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY action_history
    ADD CONSTRAINT action_history_pkey PRIMARY KEY (id);


--
-- Name: auth_group_perms auth_group_perms_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_group_perms
    ADD CONSTRAINT auth_group_perms_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: auth_user_group auth_user_group_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_group
    ADD CONSTRAINT auth_user_group_pkey PRIMARY KEY (id);


--
-- Name: auth_user_password auth_user_password_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_password
    ADD CONSTRAINT auth_user_password_pkey PRIMARY KEY (id);


--
-- Name: auth_user auth_user_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user
    ADD CONSTRAINT auth_user_pkey PRIMARY KEY (id);


--
-- Name: auth_user_token auth_user_token_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_token
    ADD CONSTRAINT auth_user_token_pkey PRIMARY KEY (id);


--
-- Name: eventsourcing_event_stream eventsourcing_event_stream_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY eventsourcing_event_stream
    ADD CONSTRAINT eventsourcing_event_stream_pkey PRIMARY KEY (id);


--
-- Name: issues_aliases issues_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY issues_aliases
    ADD CONSTRAINT issues_aliases_pkey PRIMARY KEY (id);


--
-- Name: issues_event issues_event_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY issues_event
    ADD CONSTRAINT issues_event_pkey PRIMARY KEY (id);


--
-- Name: issues_issue_assignee issues_issue_assignee_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY issues_issue_assignee
    ADD CONSTRAINT issues_issue_assignee_pkey PRIMARY KEY (id);


--
-- Name: issues_issue_label issues_issue_label_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY issues_issue_label
    ADD CONSTRAINT issues_issue_label_pkey PRIMARY KEY (id);


--
-- Name: issues_issue issues_issue_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY issues_issue
    ADD CONSTRAINT issues_issue_pkey PRIMARY KEY (id);


--
-- Name: issues_label issues_label_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY issues_label
    ADD CONSTRAINT issues_label_pkey PRIMARY KEY (id);


--
-- Name: logger_line logger_line_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY logger_line
    ADD CONSTRAINT logger_line_pkey PRIMARY KEY (id);


--
-- Name: notifications_channelconfig notifications_channelconfig_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY notifications_channelconfig
    ADD CONSTRAINT notifications_channelconfig_pkey PRIMARY KEY (id);


--
-- Name: notifications_notification notifications_notification_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY notifications_notification
    ADD CONSTRAINT notifications_notification_pkey PRIMARY KEY (id);


--
-- Name: perms_acl perms_acl_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY perms_acl
    ADD CONSTRAINT perms_acl_pkey PRIMARY KEY (id);


--
-- Name: plugin_data plugin_data_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY plugin_data
    ADD CONSTRAINT plugin_data_pkey PRIMARY KEY (id);


--
-- Name: project_dashboard project_dashboard_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY project_dashboard
    ADD CONSTRAINT project_dashboard_pkey PRIMARY KEY (id);


--
-- Name: rules_action_state rules_action_state_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY rules_action_state
    ADD CONSTRAINT rules_action_state_pkey PRIMARY KEY (id);


--
-- Name: rules_rule rules_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY rules_rule
    ADD CONSTRAINT rules_rule_pkey PRIMARY KEY (id);


--
-- Name: rules_v2_rule rules_v2_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY rules_v2_rule
    ADD CONSTRAINT rules_v2_rule_pkey PRIMARY KEY (id);


--
-- Name: rules_v2_rule_state rules_v2_rule_state_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY rules_v2_rule_state
    ADD CONSTRAINT rules_v2_rule_state_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: project_project serverboard_serverboard_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY project_project
    ADD CONSTRAINT serverboard_serverboard_pkey PRIMARY KEY (id);


--
-- Name: project_project_service serverboard_serverboard_service_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY project_project_service
    ADD CONSTRAINT serverboard_serverboard_service_pkey PRIMARY KEY (id);


--
-- Name: project_project_tag serverboard_serverboard_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY project_project_tag
    ADD CONSTRAINT serverboard_serverboard_tag_pkey PRIMARY KEY (id);


--
-- Name: project_widget serverboard_widget_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY project_widget
    ADD CONSTRAINT serverboard_widget_pkey PRIMARY KEY (id);


--
-- Name: service_service service_service_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY service_service
    ADD CONSTRAINT service_service_pkey PRIMARY KEY (id);


--
-- Name: service_service_tag service_service_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY service_service_tag
    ADD CONSTRAINT service_service_tag_pkey PRIMARY KEY (id);


--
-- Name: settings_settings settings_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY settings_settings
    ADD CONSTRAINT settings_settings_pkey PRIMARY KEY (id);


--
-- Name: settings_user_settings settings_user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY settings_user_settings
    ADD CONSTRAINT settings_user_settings_pkey PRIMARY KEY (id);


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
-- Name: issues_aliases_alias_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX issues_aliases_alias_index ON issues_aliases USING btree (alias);


--
-- Name: issues_aliases_issue_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX issues_aliases_issue_id_index ON issues_aliases USING btree (issue_id);


--
-- Name: logger_line__gin_search; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX logger_line__gin_search ON logger_line USING gin (to_tsvector('english'::regconfig, (message || (meta)::text)));


--
-- Name: logger_line_level_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX logger_line_level_index ON logger_line USING btree (level);


--
-- Name: logger_line_meta__service__index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX logger_line_meta__service__index ON logger_line USING btree (((meta ->> 'service'::text)));


--
-- Name: logger_line_meta__service_id__index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX logger_line_meta__service_id__index ON logger_line USING btree (((meta ->> 'service_id'::text)));


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
-- Name: perms_acl_object_type_object_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX perms_acl_object_type_object_index ON perms_acl USING btree (object_type, object);


--
-- Name: perms_acl_object_type_object_object_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX perms_acl_object_type_object_object_id_index ON perms_acl USING btree (object_type, object, object_id);


--
-- Name: perms_acl_permission_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX perms_acl_permission_index ON perms_acl USING btree (permission);


--
-- Name: perms_acl_role_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX perms_acl_role_index ON perms_acl USING btree (role);


--
-- Name: perms_acl_role_role_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX perms_acl_role_role_id_index ON perms_acl USING btree (role, role_id);


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
-- Name: project_dashboard_project_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX project_dashboard_project_id_index ON project_dashboard USING btree (project_id);


--
-- Name: project_dashboard_uuid_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX project_dashboard_uuid_index ON project_dashboard USING btree (uuid);


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

CREATE INDEX rules_rule_serverboard_id_index ON rules_rule USING btree (project_id);


--
-- Name: rules_rule_uuid_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX rules_rule_uuid_index ON rules_rule USING btree (uuid);


--
-- Name: rules_v2_rule_deleted_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX rules_v2_rule_deleted_index ON rules_v2_rule USING btree (deleted);


--
-- Name: rules_v2_rule_is_active_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX rules_v2_rule_is_active_index ON rules_v2_rule USING btree (is_active);


--
-- Name: rules_v2_rule_project_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX rules_v2_rule_project_id_index ON rules_v2_rule USING btree (project_id);


--
-- Name: rules_v2_rule_state_rule_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX rules_v2_rule_state_rule_id_index ON rules_v2_rule_state USING btree (rule_id);


--
-- Name: rules_v2_rule_uuid_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX rules_v2_rule_uuid_index ON rules_v2_rule USING btree (uuid);


--
-- Name: rules_v2_rule_uuid_is_active_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX rules_v2_rule_uuid_is_active_index ON rules_v2_rule USING btree (uuid, is_active);


--
-- Name: serverboard_serverboard_priority_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX serverboard_serverboard_priority_index ON project_project USING btree (priority);


--
-- Name: serverboard_serverboard_service_serverboard_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX serverboard_serverboard_service_serverboard_id_index ON project_project_service USING btree (project_id);


--
-- Name: serverboard_serverboard_service_service_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX serverboard_serverboard_service_service_id_index ON project_project_service USING btree (service_id);


--
-- Name: serverboard_serverboard_shortname_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE UNIQUE INDEX serverboard_serverboard_shortname_index ON project_project USING btree (shortname);


--
-- Name: serverboard_serverboard_tag_serverboard_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX serverboard_serverboard_tag_serverboard_id_index ON project_project_tag USING btree (project_id);


--
-- Name: serverboard_widget_uuid_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX serverboard_widget_uuid_index ON project_widget USING btree (uuid);


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
-- Name: settings_user_settings_section_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX settings_user_settings_section_index ON settings_user_settings USING btree (section);


--
-- Name: settings_user_settings_section_user_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX settings_user_settings_section_user_id_index ON settings_user_settings USING btree (section, user_id);


--
-- Name: settings_user_settings_user_id_index; Type: INDEX; Schema: public; Owner: serverboards
--

CREATE INDEX settings_user_settings_user_id_index ON settings_user_settings USING btree (user_id);


--
-- Name: auth_group_perms auth_group_perms_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_group_perms
    ADD CONSTRAINT auth_group_perms_group_id_fkey FOREIGN KEY (group_id) REFERENCES auth_group(id);


--
-- Name: auth_group_perms auth_group_perms_perm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_group_perms
    ADD CONSTRAINT auth_group_perms_perm_id_fkey FOREIGN KEY (perm_id) REFERENCES auth_permission(id);


--
-- Name: auth_user_group auth_user_group_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_group
    ADD CONSTRAINT auth_user_group_group_id_fkey FOREIGN KEY (group_id) REFERENCES auth_group(id);


--
-- Name: auth_user_group auth_user_group_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY auth_user_group
    ADD CONSTRAINT auth_user_group_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth_user(id);


--
-- Name: project_widget project_widget_dashboard_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: serverboards
--

ALTER TABLE ONLY project_widget
    ADD CONSTRAINT project_widget_dashboard_id_fkey FOREIGN KEY (dashboard_id) REFERENCES project_dashboard(id);

--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: serverboards
--

COPY schema_migrations (version, inserted_at) FROM stdin;
20160314154348  2016-10-05 16:11:06
20160405085306  2016-10-05 16:11:06
20160425101237  2016-10-05 16:11:06
20160428164310  2016-10-05 16:11:06
20160523115207  2016-10-05 16:11:06
20160527163130  2016-10-05 16:11:06
20160615111151  2016-10-05 16:11:07
20160620094318  2016-10-05 16:11:07
20160623110443  2016-10-05 16:11:07
20160711162212  2016-10-05 16:11:07
20160722074911  2016-10-05 16:11:07
20160722104205  2016-10-05 16:11:07
20160722104829  2016-10-05 16:11:07
20160726112621  2016-10-05 16:11:07
20160817200742  2016-10-05 16:11:07
20160819125319  2016-10-05 16:11:07
20161025113150  2016-10-25 11:36:28
20161130124541  2016-11-30 12:47:06
20161205164453  2016-12-05 16:55:54
20161221162703  2016-12-21 16:39:20
20161223105907  2016-12-23 11:17:22
20170124172724  2017-01-24 17:28:57
20170126112747  2017-01-26 11:35:05
20170127102714  2017-01-27 10:53:21
20170301162403  2017-03-01 16:29:04.348993
20170503151650  2017-05-03 15:18:51.75847
20170505084839  2017-05-05 09:09:54.686715
20170510090604  2017-06-26 17:10:24.665416
20170522202029  2017-06-26 17:10:24.713509
20170615144449  2017-06-26 17:10:24.80544
20170623160506  2017-06-27 16:35:41.784651
20170623160905  2017-07-11 10:43:17.668267
\.


--
-- PostgreSQL database dump complete
--

