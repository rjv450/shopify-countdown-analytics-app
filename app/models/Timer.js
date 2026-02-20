import mongoose from 'mongoose';

const timerSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ['fixed', 'evergreen'],
      required: true,
    },
    // Fixed timer fields
    startDate: {
      type: Date,
      required: function () {
        return this.type === 'fixed';
      },
    },
    endDate: {
      type: Date,
      required: function () {
        return this.type === 'fixed';
      },
    },
    // Evergreen timer fields
    duration: {
      type: Number, // in seconds
      required: function () {
        return this.type === 'evergreen';
      },
      min: 60, // minimum 1 minute
      max: 86400, // maximum 24 hours
    },
    // Targeting
    targetType: {
      type: String,
      enum: ['all', 'products', 'collections'],
      required: true,
      default: 'all',
    },
    targetIds: {
      type: [String],
      default: [],
    },
    // Customization
    customization: {
      backgroundColor: {
        type: String,
        default: '#ff0000',
      },
      textColor: {
        type: String,
        default: '#ffffff',
      },
      position: {
        type: String,
        enum: ['top', 'bottom', 'custom'],
        default: 'top',
      },
      timerSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium',
      },
      title: {
        type: String,
        default: '',
        maxlength: 100,
      },
      description: {
        type: String,
        default: '',
        maxlength: 500,
      },
      showDescription: {
        type: Boolean,
        default: false,
      },
      message: {
        type: String,
        default: 'Hurry! Sale ends in',
        maxlength: 200,
      },
      showUrgency: {
        type: Boolean,
        default: true,
      },
      urgencyThreshold: {
        type: Number, // seconds remaining to show urgency
        default: 3600, // 1 hour
      },
      urgencyNotification: {
        type: String,
        enum: ['color-pulse', 'text-blink', 'none'],
        default: 'color-pulse',
      },
    },
    // Priority (higher number = higher priority, used when multiple timers match)
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Status
    status: {
      type: String,
      enum: ['active', 'scheduled', 'expired', 'draft'],
      default: 'draft',
      index: true,
    },
    // Analytics
    impressions: {
      type: Number,
      default: 0,
    },
    lastImpressionAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
timerSchema.index({ shop: 1, status: 1 });
timerSchema.index({ shop: 1, targetType: 1, targetIds: 1 });

// Method to check if timer is active
timerSchema.methods.isActive = function () {
  if (this.status === 'expired' || this.status === 'draft') {
    return false;
  }
  if (this.type === 'fixed') {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }
  // Evergreen timers are always "active" if status is active
  return this.status === 'active';
};

// Method to get remaining time (for fixed timers)
timerSchema.methods.getRemainingTime = function () {
  if (this.type === 'fixed' && this.isActive()) {
    return Math.max(0, Math.floor((this.endDate - new Date()) / 1000));
  }
  return null;
};

// Method to increment impressions
timerSchema.methods.incrementImpression = async function () {
  this.impressions += 1;
  this.lastImpressionAt = new Date();
  await this.save();
};

// Pre-save hook to update status
// Only auto-update status if it's not being manually set
timerSchema.pre('save', function (next) {
  if (this.type === 'fixed') {
    const now = new Date();
    // Only auto-update if status is not explicitly set to 'draft'
    // This allows manual status control
    if (this.status !== 'draft') {
      if (now < this.startDate) {
        this.status = 'scheduled';
      } else if (now > this.endDate) {
        this.status = 'expired';
      } else {
        // Only set to active if currently scheduled or expired (not if already active)
        if (this.status === 'scheduled' || this.status === 'expired') {
          this.status = 'active';
        }
      }
    }
  }
  next();
});

const Timer = mongoose.model('Timer', timerSchema);

export default Timer;


