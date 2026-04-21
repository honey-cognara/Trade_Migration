import { Navbar } from './Navbar'
import { Footer } from './Footer'

export function Layout({ children }) {
  return (
    <div className="tc-app">
      <Navbar />
      <main className="tc-main">{children}</main>
      <Footer />
    </div>
  )
}


