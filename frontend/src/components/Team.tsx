import { AUTHOR_GITHUB, SITE_NAME } from '../config/site.ts'

export function Team() {
  return (
    <article className="page" aria-labelledby="team-title">
      <h1 id="team-title">Team</h1>
      <article className="card team-card">
        <h2>{SITE_NAME}</h2>
        <ul className="team-roles">
          <li>Smart contract engineer</li>
          <li>Website designer</li>
        </ul>
        <a href={AUTHOR_GITHUB} target="_blank" rel="noreferrer noopener">
          github.com/milanicode
        </a>
      </article>
    </article>
  )
}
