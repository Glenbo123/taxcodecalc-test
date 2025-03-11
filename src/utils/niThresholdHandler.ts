import { debugTax } from './debug';
import { logError, ErrorSeverity } from './errorLogger';

interface NIThresholds {
  PRIMARY_THRESHOLD: {
    WEEKLY: number;
    MONTHLY: number;
    ANNUAL: number;
  };
  UPPER_EARNINGS_LIMIT: {
    WEEKLY: number;
    MONTHLY: number;
    ANNUAL: number;
  };
}

interface ThresholdValidationResult {
  thresholds: NIThresholds;
  status: 'success' | 'fallback' | 'error';
  warnings?: string[];
}

const DEFAULT_THRESHOLDS: NIThresholds = {
  PRIMARY_THRESHOLD: {
    WEEKLY: 242,
    MONTHLY: 1048,
    ANNUAL: 12576
  },
  UPPER_EARNINGS_LIMIT: {
    WEEKLY: 967,
    MONTHLY: 4189,
    ANNUAL: 50268
  }
};

/**
 * Validates and processes NI thresholds with comprehensive error handling
 * @param thresholds Optional NI thresholds to validate
 * @param env Environment ('development' | 'production')
 * @returns Validated thresholds with status information
 */
export function validateNIThresholds(
  thresholds?: Partial<NIThresholds>,
  env: 'development' | 'production' = process.env.NODE_ENV || 'development'
): ThresholdValidationResult {
  const warnings: string[] = [];
  const isDev = env === 'development';

  try {
    // Input validation
    if (!thresholds) {
      if (isDev) {
        console.warn('No NI thresholds provided, using default values');
      }
      return {
        thresholds: DEFAULT_THRESHOLDS,
        status: 'fallback',
        warnings: ['Using default thresholds']
      };
    }

    // Validate threshold structure
    const validatedThresholds: NIThresholds = {
      PRIMARY_THRESHOLD: validateThresholdGroup(thresholds.PRIMARY_THRESHOLD, 'PRIMARY_THRESHOLD'),
      UPPER_EARNINGS_LIMIT: validateThresholdGroup(thresholds.UPPER_EARNINGS_LIMIT, 'UPPER_EARNINGS_LIMIT')
    };

    // Validate threshold relationships
    validateThresholdRelationships(validatedThresholds, warnings);

    // Log any non-critical issues
    if (warnings.length > 0 && isDev) {
      console.warn('NI threshold warnings:', warnings);
    }

    return {
      thresholds: validatedThresholds,
      status: warnings.length > 0 ? 'fallback' : 'success',
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    // Handle critical errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in NI threshold validation';
    
    // Log detailed error in development, sanitized in production
    logError(error instanceof Error ? error : new Error(errorMessage), {
      component: 'niThresholdHandler',
      thresholds: isDev ? JSON.stringify(thresholds) : undefined
    }, ErrorSeverity.ERROR);

    debugTax('NI threshold validation failed:', {
      error,
      providedThresholds: thresholds
    });

    // Return safe fallback values
    return {
      thresholds: DEFAULT_THRESHOLDS,
      status: 'error',
      warnings: [isDev ? errorMessage : 'Error processing thresholds, using defaults']
    };
  }
}

/**
 * Validates a specific threshold group (PRIMARY_THRESHOLD or UPPER_EARNINGS_LIMIT)
 * @param group Threshold group to validate
 * @param groupName Name of the threshold group for error messages
 * @returns Validated threshold group
 */
function validateThresholdGroup(
  group: Partial<NIThresholds['PRIMARY_THRESHOLD']> | undefined,
  groupName: string
): NIThresholds['PRIMARY_THRESHOLD'] {
  if (!group) {
    return DEFAULT_THRESHOLDS[groupName as keyof NIThresholds];
  }

  const defaultGroup = DEFAULT_THRESHOLDS[groupName as keyof NIThresholds];
  
  return {
    WEEKLY: validateThresholdValue(group.WEEKLY, defaultGroup.WEEKLY, `${groupName}.WEEKLY`),
    MONTHLY: validateThresholdValue(group.MONTHLY, defaultGroup.MONTHLY, `${groupName}.MONTHLY`),
    ANNUAL: validateThresholdValue(group.ANNUAL, defaultGroup.ANNUAL, `${groupName}.ANNUAL`)
  };
}

/**
 * Validates a single threshold value
 * @param value Value to validate
 * @param defaultValue Default value to use if invalid
 * @param fieldName Field name for error messages
 * @returns Validated threshold value
 */
function validateThresholdValue(
  value: number | undefined,
  defaultValue: number,
  fieldName: string
): number {
  if (typeof value !== 'number' || isNaN(value) || value < 0) {
    throw new Error(`Invalid ${fieldName} threshold: ${value}`);
  }
  return value;
}

/**
 * Validates relationships between different thresholds
 * @param thresholds Complete set of thresholds to validate
 * @param warnings Array to collect warning messages
 */
function validateThresholdRelationships(
  thresholds: NIThresholds,
  warnings: string[]
): void {
  // Validate PRIMARY_THRESHOLD is less than UPPER_EARNINGS_LIMIT
  if (thresholds.PRIMARY_THRESHOLD.ANNUAL >= thresholds.UPPER_EARNINGS_LIMIT.ANNUAL) {
    warnings.push('PRIMARY_THRESHOLD should be less than UPPER_EARNINGS_LIMIT');
  }

  // Validate weekly/monthly/annual relationships
  validatePeriodRelationships(thresholds.PRIMARY_THRESHOLD, 'PRIMARY_THRESHOLD', warnings);
  validatePeriodRelationships(thresholds.UPPER_EARNINGS_LIMIT, 'UPPER_EARNINGS_LIMIT', warnings);
}

/**
 * Validates relationships between weekly, monthly, and annual values
 * @param group Threshold group to validate
 * @param groupName Name of the group for warning messages
 * @param warnings Array to collect warning messages
 */
function validatePeriodRelationships(
  group: NIThresholds['PRIMARY_THRESHOLD'],
  groupName: string,
  warnings: string[]
): void {
  const weeklyToAnnual = group.WEEKLY * 52;
  const monthlyToAnnual = group.MONTHLY * 12;

  const tolerance = 0.01; // 1% tolerance for rounding differences

  if (Math.abs(weeklyToAnnual - group.ANNUAL) / group.ANNUAL > tolerance) {
    warnings.push(`${groupName} weekly value does not align with annual value`);
  }

  if (Math.abs(monthlyToAnnual - group.ANNUAL) / group.ANNUAL > tolerance) {
    warnings.push(`${groupName} monthly value does not align with annual value`);
  }
}