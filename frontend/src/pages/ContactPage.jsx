export function ContactPage() {
  return (
    <div className="tc-page">
      <section className="tc-section">
        <div className="tc-section-header">
          <p className="tc-eyebrow">Contact</p>
          <h1>Start a conversation with Mazdoor Migration</h1>
          <p>
            Share a few details about your situation and we&apos;ll outline the
            next steps in your pathway – whether you&apos;re an overseas tradie
            or an Australian employer.
          </p>
        </div>
        <div className="tc-grid-2">
          <div className="tc-card">
            <h2>Enquiry details</h2>
            <form
              className="tc-form"
              onSubmit={(e) => {
                e.preventDefault()
              }}
            >
              <div className="tc-form-row tc-form-row-inline">
                <label>
                  First name
                  <input type="text" placeholder="Jane" />
                </label>
                <label>
                  Last name
                  <input type="text" placeholder="Smith" />
                </label>
              </div>
              <div className="tc-form-row tc-form-row-inline">
                <label>
                  Email
                  <input type="email" placeholder="you@example.com" />
                </label>
                <label>
                  Phone (incl. country code)
                  <input type="tel" placeholder="+61 4XX XXX XXX" />
                </label>
              </div>
              <div className="tc-form-row tc-form-row-inline">
                <label>
                  I am
                  <select>
                    <option value="tradie">An overseas electrician / tradie</option>
                    <option value="employer">An Australian employer</option>
                    <option value="provider">A training provider</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label>
                  Current country
                  <input type="text" placeholder="e.g. United Kingdom" />
                </label>
              </div>
              <div className="tc-form-row">
                <label>
                  Subject
                  <input
                    type="text"
                    placeholder="OTSR, licensing pathway or employer enquiry"
                  />
                </label>
              </div>
              <div className="tc-form-row">
                <label>
                  Message
                  <textarea
                    rows="5"
                    placeholder="Tell us briefly about your experience, timeframe and what you would like help with."
                  />
                </label>
              </div>
              <button type="submit" className="tc-btn tc-btn-primary">
                Submit enquiry
              </button>
            </form>
          </div>
          <div className="tc-card tc-card-ghost">
            <h2>How we respond</h2>
            <ul>
              <li>High-level pathway overview for your situation.</li>
              <li>Indicative timelines and likely next steps.</li>
              <li>Options for employer or training introductions.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}


