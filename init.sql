CREATE TABLE aliases
(
  ID SERIAL PRIMARY KEY,
  alias VARCHAR(255) NOT NULL,
  projectId integer NOT NULL
);

CREATE TABLE projects
(
  ID SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL
);

CREATE TABLE sections
(
  ID SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  rank integer NOT NULL,
  projectId integer NOT NULL
);

CREATE TABLE items
(
  ID SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(255) NOT NULL,
  description VARCHAR(255),
  type VARCHAR(32) NOT NULL,
  rank integer NOT NULL,
  sectionId integer NOT NULL
);

CREATE TABLE settings
(
  ID SERIAL PRIMARY KEY,
  name VARCHAR(255),
  value VARCHAR(255)
);

CREATE TABLE lookups
(
  ID SERIAL PRIMARY KEY,
  projectName VARCHAR(255) NOT NULL,
  userId VARCHAR(255) NOT NULL,
  requestType VARCHAR(255) NOT NULL,
  dateTime TIMESTAMPTZ
);
