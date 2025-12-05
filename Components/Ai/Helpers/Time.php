<?php

namespace SuggerenceGutenberg\Components\Ai\Helpers;

class Time
{
    /**
     * Get the current timestamp.
     */
    public static function now()
    {
        return time();
    }

    /**
     * Get the current date in a specific format.
     */
    public static function nowFormat($format = 'Y-m-d H:i:s')
    {
        return date($format);
    }

    /**
     * Get the current date as a DateTime object.
     */
    public static function nowDateTime()
    {
        return new \DateTime();
    }

    /**
     * Create a time instance from a timestamp.
     */
    public static function fromTimestamp($timestamp)
    {
        return new TimeInstance($timestamp);
    }

    /**
     * Create a time instance from a date string.
     */
    public static function fromString($dateString)
    {
        return new TimeInstance(strtotime($dateString));
    }

    /**
     * Create a time instance from a DateTime object.
     */
    public static function fromDateTime(\DateTime $dateTime)
    {
        return new TimeInstance($dateTime->getTimestamp());
    }

    /**
     * Get the current time in a specific timezone.
     */
    public static function nowInTimezone($timezone)
    {
        $dateTime = new \DateTime('now', new \DateTimeZone($timezone));
        return new TimeInstance($dateTime->getTimestamp());
    }

    /**
     * Parse a date string and return a TimeInstance.
     */
    public static function parse($dateString)
    {
        return static::fromString($dateString);
    }

    /**
     * Create a time instance for today.
     */
    public static function today()
    {
        return new TimeInstance(strtotime('today'));
    }

    /**
     * Create a time instance for yesterday.
     */
    public static function yesterday()
    {
        return new TimeInstance(strtotime('yesterday'));
    }

    /**
     * Create a time instance for tomorrow.
     */
    public static function tomorrow()
    {
        return new TimeInstance(strtotime('tomorrow'));
    }

    /**
     * Create a time instance for the start of the week.
     */
    public static function startOfWeek($weekStartsOn = 1)
    {
        $timestamp = time();
        $dayOfWeek = date('N', $timestamp);
        $daysToSubtract = ($dayOfWeek - $weekStartsOn) % 7;
        
        return new TimeInstance($timestamp - ($daysToSubtract * 86400));
    }

    /**
     * Create a time instance for the end of the week.
     */
    public static function endOfWeek($weekStartsOn = 1)
    {
        $startOfWeek = static::startOfWeek($weekStartsOn);
        return $startOfWeek->addDays(6);
    }

    /**
     * Create a time instance for the start of the month.
     */
    public static function startOfMonth()
    {
        return new TimeInstance(strtotime('first day of this month'));
    }

    /**
     * Create a time instance for the end of the month.
     */
    public static function endOfMonth()
    {
        return new TimeInstance(strtotime('last day of this month'));
    }

    /**
     * Create a time instance for the start of the year.
     */
    public static function startOfYear()
    {
        return new TimeInstance(strtotime('first day of January this year'));
    }

    /**
     * Create a time instance for the end of the year.
     */
    public static function endOfYear()
    {
        return new TimeInstance(strtotime('last day of December this year'));
    }

    /**
     * Check if a timestamp is today.
     */
    public static function isToday($timestamp)
    {
        return date('Y-m-d', $timestamp) === date('Y-m-d');
    }

    /**
     * Check if a timestamp is yesterday.
     */
    public static function isYesterday($timestamp)
    {
        return date('Y-m-d', $timestamp) === date('Y-m-d', strtotime('yesterday'));
    }

    /**
     * Check if a timestamp is tomorrow.
     */
    public static function isTomorrow($timestamp)
    {
        return date('Y-m-d', $timestamp) === date('Y-m-d', strtotime('tomorrow'));
    }

    /**
     * Get the difference in seconds between two timestamps.
     */
    public static function diffInSeconds($timestamp1, $timestamp2)
    {
        return abs($timestamp1 - $timestamp2);
    }

    /**
     * Get the difference in minutes between two timestamps.
     */
    public static function diffInMinutes($timestamp1, $timestamp2)
    {
        return static::diffInSeconds($timestamp1, $timestamp2) / 60;
    }

    /**
     * Get the difference in hours between two timestamps.
     */
    public static function diffInHours($timestamp1, $timestamp2)
    {
        return static::diffInMinutes($timestamp1, $timestamp2) / 60;
    }

    /**
     * Get the difference in days between two timestamps.
     */
    public static function diffInDays($timestamp1, $timestamp2)
    {
        return static::diffInHours($timestamp1, $timestamp2) / 24;
    }

    /**
     * Format a timestamp as a human-readable relative time.
     */
    public static function humanDiff($timestamp)
    {
        $now = time();
        $diff = $now - $timestamp;

        if ($diff < 60) {
            return $diff . ' seconds ago';
        } elseif ($diff < 3600) {
            $minutes = floor($diff / 60);
            return $minutes . ' minute' . ($minutes > 1 ? 's' : '') . ' ago';
        } elseif ($diff < 86400) {
            $hours = floor($diff / 3600);
            return $hours . ' hour' . ($hours > 1 ? 's' : '') . ' ago';
        } elseif ($diff < 2592000) {
            $days = floor($diff / 86400);
            return $days . ' day' . ($days > 1 ? 's' : '') . ' ago';
        } elseif ($diff < 31536000) {
            $months = floor($diff / 2592000);
            return $months . ' month' . ($months > 1 ? 's' : '') . ' ago';
        } else {
            $years = floor($diff / 31536000);
            return $years . ' year' . ($years > 1 ? 's' : '') . ' ago';
        }
    }

    /**
     * Get the age in years from a timestamp.
     */
    public static function age($timestamp)
    {
        return date('Y') - date('Y', $timestamp) - (date('md', $timestamp) > date('md') ? 1 : 0);
    }

    /**
     * Check if a year is a leap year.
     */
    public static function isLeapYear($year = null)
    {
        $year = $year ?: date('Y');
        return ($year % 4 == 0 && $year % 100 != 0) || ($year % 400 == 0);
    }

    /**
     * Get the number of days in a month.
     */
    public static function daysInMonth($month = null, $year = null)
    {
        $month = $month ?: date('n');
        $year = $year ?: date('Y');
        
        return cal_days_in_month(CAL_GREGORIAN, $month, $year);
    }

    /**
     * Get the timezone offset in seconds.
     */
    public static function timezoneOffset($timezone = null)
    {
        $timezone = $timezone ?: date_default_timezone_get();
        $dateTime = new \DateTime('now', new \DateTimeZone($timezone));
        return $dateTime->getOffset();
    }

    /**
     * Convert a timestamp to a different timezone.
     */
    public static function convertTimezone($timestamp, $fromTimezone, $toTimezone)
    {
        $dateTime = new \DateTime();
        $dateTime->setTimestamp($timestamp);
        $dateTime->setTimezone(new \DateTimeZone($fromTimezone));
        $dateTime->setTimezone(new \DateTimeZone($toTimezone));
        
        return $dateTime->getTimestamp();
    }
}
