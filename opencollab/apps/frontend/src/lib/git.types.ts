export interface GiteaRepo {
  id:              number
  name:            string
  full_name:       string
  description:     string
  private:         boolean
  html_url:        string
  clone_url:       string
  default_branch:  string
  stars_count:     number
  forks_count:     number
  open_issues_count: number
  updated_at:      string
  owner:           { login: string; avatar_url: string }
}

export interface GiteaBranch {
  name:   string
  commit: { id: string; message: string; timestamp: string }
}

export interface GiteaCommit {
  sha:      string
  html_url: string
  commit: {
    message: string
    author:  { name: string; email: string; date: string }
  }
  author: { login: string; avatar_url: string } | null
}

export interface GiteaIssue {
  id:         number
  number:     number
  title:      string
  body:       string
  state:      'open' | 'closed'
  html_url:   string
  labels:     { name: string; color: string }[]
  created_at: string
  updated_at: string
  user:       { login: string; avatar_url: string }
  comments:   number
}

export interface GiteaPullRequest {
  id:         number
  number:     number
  title:      string
  body:       string
  state:      'open' | 'closed'
  html_url:   string
  head:       { ref: string; sha: string }
  base:       { ref: string }
  merged:     boolean
  created_at: string
  user:       { login: string; avatar_url: string }
}
