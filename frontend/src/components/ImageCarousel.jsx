import { useEffect, useState } from 'react'

const slides = [
  {
    id: 1,
    title: 'On-site electrical work in Australia.',
    description:
      'See how overseas electricians plug into Australian projects and work alongside local teams.',
    image:
      'https://images.pexels.com/photos/8090147/pexels-photo-8090147.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    id: 2,
    title: 'Hands-on training and mentoring.',
    description:
      'Complete supervised practical training that aligns your experience with Australian wiring standards.',
    image:
      'https://images.pexels.com/photos/7859958/pexels-photo-7859958.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    id: 3,
    title: 'From migration plan to stable work.',
    description:
      'Combine migration support, OTSR and employer connections into one clear, supported pathway.',
    image:
      'https://images.pexels.com/photos/4254160/pexels-photo-4254160.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
]

export function ImageCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [])

  const goTo = (i) => setIndex(i)
  const next = () => setIndex((prev) => (prev + 1) % slides.length)
  const prev = () => setIndex((prev) => (prev - 1 + slides.length) % slides.length)

  return (
    <section className="tc-section tc-carousel">
      <div className="tc-carousel-inner">
        <div className="tc-carousel-visual">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`tc-carousel-slide ${i === index ? 'tc-carousel-slide-active' : ''}`}
            >
              <img src={slide.image} alt={slide.title} />
            </div>
          ))}
        </div>
        <div className="tc-carousel-copy">
          <p className="tc-eyebrow">Mazdoor Migration in action</p>
          <h2>{slides[index].title}</h2>
          <p>{slides[index].description}</p>
          <div className="tc-carousel-controls">
            <button
              type="button"
              className="tc-carousel-arrow"
              onClick={prev}
              aria-label="Previous slide"
            >
              ‹
            </button>
            <div className="tc-carousel-dots">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  className={`tc-carousel-dot ${
                    i === index ? 'tc-carousel-dot-active' : ''
                  }`}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              className="tc-carousel-arrow"
              onClick={next}
              aria-label="Next slide"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}


