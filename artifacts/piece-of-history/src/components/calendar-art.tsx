import { FrostAsset } from '@/components/site';

export function CalendarArt({ date }: { date?: Date }) {
  const day = date
    ? new Intl.DateTimeFormat('en-GB', { day: '2-digit' }).format(date)
    : '—';
  const weekday = date
    ? new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(date).toUpperCase()
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
        <div className="calendar-art__sheet">
          <div className="calendar-art__bindings" aria-hidden="true">
            <span className="calendar-art__binding" />
            <span className="calendar-art__binding" />
            <span className="calendar-art__binding" />
            <span className="calendar-art__binding" />
          </div>
          <div className="calendar-art__mast">
            <FrostAsset
              name="calendar"
              size={15}
              className="frost-asset-quiet"
            />
            <span className="calendar-art__brand">PIECE OF<br />HISTORY</span>
          </div>
          <span className="calendar-art__weekday">{weekday}</span>
          <span className="calendar-art__day">{day}</span>
          <div className="calendar-art__date-line">
            <span className="calendar-art__month">{month}</span>
            <span className="calendar-art__year">{year}</span>
          </div>
        </div>
        <FrostAsset
          name="crystal"
          size={23}
          className="calendar-art__crystal frost-asset-quiet"
        />
        <FrostAsset
          name="snowflake"
          size={15}
          className="calendar-art__snowflake frost-asset-quiet"
        />
      </div>
    </div>
  );
}