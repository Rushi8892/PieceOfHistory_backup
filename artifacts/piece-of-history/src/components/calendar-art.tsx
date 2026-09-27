const calendarIllustrationUrl = `${import.meta.env.BASE_URL}assets/today-glacier-calendar-card.png`;

export function CalendarArt({ date }: { date?: Date }) {
  const day = date
    ? new Intl.DateTimeFormat('en-GB', { day: '2-digit' }).format(date)
    : '—';
  const weekday = date
    ? new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date).toUpperCase()
    : 'TODAY';
  const month = date
    ? new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(date).toUpperCase()
    : 'DATE';
  const year = date
    ? new Intl.DateTimeFormat('en-GB', { year: 'numeric' }).format(date)
    : 'LOADING';
  const ariaLabel = date
    ? `Calendar, ${new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date)}`
    : 'Calendar date loading';

  return (
    <div className="calendar-art-wrap">
      <div className="calendar-art" role="img" aria-label={ariaLabel}>
        <span className="calendar-art__base" aria-hidden="true" />
        <img
          className="calendar-art__illustration"
          src={calendarIllustrationUrl}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
        <div className="calendar-art__date-overlay" aria-hidden="true">
          <span className="calendar-art__weekday">{weekday}</span>
          <span className="calendar-art__day">{day}</span>
          <div className="calendar-art__date-line">
            <span className="calendar-art__month">{month}</span>
            <span className="calendar-art__year">{year}</span>
          </div>
        </div>
      </div>
    </div>
  );
}