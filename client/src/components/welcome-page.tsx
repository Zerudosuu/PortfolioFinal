import { ArrowUpRight } from "lucide-react"
import { Mascot } from "page-mascot"
import welcomeData from "../content/welcome.json"

export function WelcomePage() {
  return (
    <main className="entry-page welcome-page">
      <header className="entry-header">
        <a className="entry-name" href="#/welcome" aria-label="Ron Salvador, welcome">Ron Salvador<span aria-hidden="true">.</span></a>
        <span className="entry-location">Design & development / Manila</span>
      </header>

      <div className="welcome-layout">
        <section className="welcome-copy" aria-labelledby="welcome-title">
          <h1 id="welcome-title">{welcomeData.title}</h1>
          <p className="welcome-description">{welcomeData.body}</p>
          <nav className="welcome-choices" aria-label="Choose where to go">
            <a className="welcome-choice" href="#/portfolio">
              <span>
                <strong>{welcomeData.visitingChoice.title}</strong>
                <span>{welcomeData.visitingChoice.description}</span>
              </span>
              <ArrowUpRight size={24} aria-hidden="true" />
            </a>
            <a className="welcome-choice" href="#/booking">
              <span>
                <strong>Book a conversation</strong>
                <span>{welcomeData.clientChoice.description}</span>
              </span>
              <ArrowUpRight size={24} aria-hidden="true" />
            </a>
          </nav>
        </section>

        <section className="welcome-portrait" aria-label="Meet Ron">
          <div className="portrait-stage">
            <Mascot
              directions={import.meta.env.BASE_URL + "mascots/portrait-halfbody-hd-directions.webp"}
              reactions={import.meta.env.BASE_URL + "mascots/portrait-halfbody-hd-reactions.webp"}
              size={400}
              label="Ron portrait"
              className="portrait-mascot"
            />
          </div>
          <p>Move your cursor. Tap to say hi.</p>
        </section>
      </div>

      <footer className="entry-footer">
        <span>A little hello before we get into it.</span>
        <a href="#/portfolio">Explore the portfolio <ArrowUpRight size={15} aria-hidden="true" /></a>
      </footer>
    </main>
  )
}
