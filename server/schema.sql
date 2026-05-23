CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  github_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  access_token TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  admin_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  user_id INTEGER REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pull_requests (
  id SERIAL PRIMARY KEY,
  github_pr_url TEXT NOT NULL,
  title VARCHAR(255),
  submitter_id VARCHAR(255),
  reviewer_id VARCHAR(255),
  team_id INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  pr_id INTEGER REFERENCES pull_requests(id),
  user_id INTEGER REFERENCES users(id),
  line_number INTEGER,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);