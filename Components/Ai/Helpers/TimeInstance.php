<?php

namespace SuggerenceGutenberg\Components\Ai\Helpers;

class TimeInstance
{
    /**
     * The timestamp value.
     */
    protected $timestamp;

    /**
     * Create a new time instance.
     */
    public function __construct($timestamp)
    {
        $this->timestamp = (int) $timestamp;
    }

    /**
     * Get the timestamp.
     */
    public function getTimestamp()
    {
        return $this->timestamp;
    }

    /**
     * Format the time instance.
     */
    public function format($format = 'Y-m-d H:i:s')
    {
        return date($format, $this->timestamp);
    }

    /**
     * Get the DateTime object.
     */
    public function toDateTime()
    {
        return new \DateTime('@' . $this->timestamp);
    }

    /**
     * Add seconds to the time instance.
     */
    public function addSeconds($seconds)
    {
        return new static($this->timestamp + $seconds);
    }

    /**
     * Add minutes to the time instance.
     */
    public function addMinutes($minutes)
    {
        return $this->addSeconds($minutes * 60);
    }

    /**
     * Add hours to the time instance.
     */
    public function addHours($hours)
    {
        return $this->addMinutes($hours * 60);
    }

    /**
     * Add days to the time instance.
     */
    public function addDays($days)
    {
        return $this->addHours($days * 24);
    }

    /**
     * Add weeks to the time instance.
     */
    public function addWeeks($weeks)
    {
        return $this->addDays($weeks * 7);
    }

    /**
     * Add months to the time instance.
     */
    public function addMonths($months)
    {
        $dateTime = $this->toDateTime();
        $dateTime->add(new \DateInterval('P' . $months . 'M'));
        return new static($dateTime->getTimestamp());
    }

    /**
     * Add years to the time instance.
     */
    public function addYears($years)
    {
        $dateTime = $this->toDateTime();
        $dateTime->add(new \DateInterval('P' . $years . 'Y'));
        return new static($dateTime->getTimestamp());
    }

    /**
     * Subtract seconds from the time instance.
     */
    public function subSeconds($seconds)
    {
        return new static($this->timestamp - $seconds);
    }

    /**
     * Subtract minutes from the time instance.
     */
    public function subMinutes($minutes)
    {
        return $this->subSeconds($minutes * 60);
    }

    /**
     * Subtract hours from the time instance.
     */
    public function subHours($hours)
    {
        return $this->subMinutes($hours * 60);
    }

    /**
     * Subtract days from the time instance.
     */
    public function subDays($days)
    {
        return $this->subHours($days * 24);
    }

    /**
     * Subtract weeks from the time instance.
     */
    public function subWeeks($weeks)
    {
        return $this->subDays($weeks * 7);
    }

    /**
     * Subtract months from the time instance.
     */
    public function subMonths($months)
    {
        $dateTime = $this->toDateTime();
        $dateTime->sub(new \DateInterval('P' . $months . 'M'));
        return new static($dateTime->getTimestamp());
    }

    /**
     * Subtract years from the time instance.
     */
    public function subYears($years)
    {
        $dateTime = $this->toDateTime();
        $dateTime->sub(new \DateInterval('P' . $years . 'Y'));
        return new static($dateTime->getTimestamp());
    }

    /**
     * Set the time to the start of the day.
     */
    public function startOfDay()
    {
        return new static(strtotime('midnight', $this->timestamp));
    }

    /**
     * Set the time to the end of the day.
     */
    public function endOfDay()
    {
        return new static(strtotime('tomorrow', $this->timestamp) - 1);
    }

    /**
     * Set the time to the start of the week.
     */
    public function startOfWeek($weekStartsOn = 1)
    {
        $dayOfWeek = date('N', $this->timestamp);
        $daysToSubtract = ($dayOfWeek - $weekStartsOn) % 7;
        
        return new static($this->timestamp - ($daysToSubtract * 86400));
    }

    /**
     * Set the time to the end of the week.
     */
    public function endOfWeek($weekStartsOn = 1)
    {
        $startOfWeek = $this->startOfWeek($weekStartsOn);
        return $startOfWeek->addDays(6)->endOfDay();
    }

    /**
     * Set the time to the start of the month.
     */
    public function startOfMonth()
    {
        return new static(strtotime('first day of this month', $this->timestamp));
    }

    /**
     * Set the time to the end of the month.
     */
    public function endOfMonth()
    {
        return new static(strtotime('last day of this month', $this->timestamp));
    }

    /**
     * Set the time to the start of the year.
     */
    public function startOfYear()
    {
        return new static(strtotime('first day of January this year', $this->timestamp));
    }

    /**
     * Set the time to the end of the year.
     */
    public function endOfYear()
    {
        return new static(strtotime('last day of December this year', $this->timestamp));
    }

    /**
     * Check if this time instance is today.
     */
    public function isToday()
    {
        return Time::isToday($this->timestamp);
    }

    /**
     * Check if this time instance is yesterday.
     */
    public function isYesterday()
    {
        return Time::isYesterday($this->timestamp);
    }

    /**
     * Check if this time instance is tomorrow.
     */
    public function isTomorrow()
    {
        return Time::isTomorrow($this->timestamp);
    }

    /**
     * Check if this time instance is in the past.
     */
    public function isPast()
    {
        return $this->timestamp < time();
    }

    /**
     * Check if this time instance is in the future.
     */
    public function isFuture()
    {
        return $this->timestamp > time();
    }

    /**
     * Check if this time instance is a weekday.
     */
    public function isWeekday()
    {
        $dayOfWeek = date('N', $this->timestamp);
        return $dayOfWeek >= 1 && $dayOfWeek <= 5;
    }

    /**
     * Check if this time instance is a weekend.
     */
    public function isWeekend()
    {
        return !$this->isWeekday();
    }

    /**
     * Get the difference in seconds from another time instance.
     */
    public function diffInSeconds(TimeInstance $other)
    {
        return abs($this->timestamp - $other->getTimestamp());
    }

    /**
     * Get the difference in minutes from another time instance.
     */
    public function diffInMinutes(TimeInstance $other)
    {
        return $this->diffInSeconds($other) / 60;
    }

    /**
     * Get the difference in hours from another time instance.
     */
    public function diffInHours(TimeInstance $other)
    {
        return $this->diffInMinutes($other) / 60;
    }

    /**
     * Get the difference in days from another time instance.
     */
    public function diffInDays(TimeInstance $other)
    {
        return $this->diffInHours($other) / 24;
    }

    /**
     * Get the human-readable difference from now.
     */
    public function humanDiff()
    {
        return Time::humanDiff($this->timestamp);
    }

    /**
     * Get the age in years.
     */
    public function age()
    {
        return Time::age($this->timestamp);
    }

    /**
     * Get the day of the week (1-7, Monday-Sunday).
     */
    public function dayOfWeek()
    {
        return date('N', $this->timestamp);
    }

    /**
     * Get the day of the year (1-366).
     */
    public function dayOfYear()
    {
        return date('z', $this->timestamp) + 1;
    }

    /**
     * Get the week of the year.
     */
    public function weekOfYear()
    {
        return date('W', $this->timestamp);
    }

    /**
     * Get the month.
     */
    public function month()
    {
        return date('n', $this->timestamp);
    }

    /**
     * Get the year.
     */
    public function year()
    {
        return date('Y', $this->timestamp);
    }

    /**
     * Get the day of the month.
     */
    public function day()
    {
        return date('j', $this->timestamp);
    }

    /**
     * Get the hour (0-23).
     */
    public function hour()
    {
        return date('G', $this->timestamp);
    }

    /**
     * Get the minute (0-59).
     */
    public function minute()
    {
        return date('i', $this->timestamp);
    }

    /**
     * Get the second (0-59).
     */
    public function second()
    {
        return date('s', $this->timestamp);
    }

    /**
     * Check if this time instance is equal to another.
     */
    public function equalTo(TimeInstance $other)
    {
        return $this->timestamp === $other->getTimestamp();
    }

    /**
     * Check if this time instance is before another.
     */
    public function isBefore(TimeInstance $other)
    {
        return $this->timestamp < $other->getTimestamp();
    }

    /**
     * Check if this time instance is after another.
     */
    public function isAfter(TimeInstance $other)
    {
        return $this->timestamp > $other->getTimestamp();
    }

    /**
     * Check if this time instance is between two others.
     */
    public function isBetween(TimeInstance $start, TimeInstance $end)
    {
        return $this->timestamp >= $start->getTimestamp() && $this->timestamp <= $end->getTimestamp();
    }

    /**
     * Convert to string representation.
     */
    public function __toString()
    {
        return $this->format();
    }
}
