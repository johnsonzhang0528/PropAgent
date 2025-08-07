import mongoose, { Document, Schema } from 'mongoose';

export interface IProperty extends Document {
  agent_id?: mongoose.Types.ObjectId;
  company_id: mongoose.Types.ObjectId;
  property_type: 'apartment' | 'house' | 'commercial' | 'land';
  listing_type: 'sale' | 'rent';
  title: string;
  description?: string;
  address: string;
  district: string;
  city: string;
  postal_code?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  price: number;
  area: number;
  area_unit: string;
  bedrooms?: number;
  bathrooms?: number;
  parking_spots?: number;
  floor?: number;
  total_floors?: number;
  building_age?: number;
  features: string[];
  amenities: string[];
  transport_info: {
    mrt_stations?: string[];
    bus_stops?: string[];
    distance_to_mrt?: number;
  };
  school_district?: string;
  status: 'available' | 'pending' | 'sold' | 'rented' | 'withdrawn';
  available_from?: Date;
  images: string[];
  documents: string[];
  virtual_tour_url?: string;
  listing_expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const PropertySchema: Schema = new Schema({
  agent_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  company_id: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  property_type: {
    type: String,
    enum: ['apartment', 'house', 'commercial', 'land'],
    required: true
  },
  listing_type: {
    type: String,
    enum: ['sale', 'rent'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  postal_code: {
    type: String,
    trim: true,
    maxlength: 10
  },
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  area: {
    type: Number,
    required: true,
    min: 0
  },
  area_unit: {
    type: String,
    default: 'ping',
    enum: ['ping', 'sqm', 'sqft']
  },
  bedrooms: {
    type: Number,
    min: 0,
    max: 20
  },
  bathrooms: {
    type: Number,
    min: 0,
    max: 20
  },
  parking_spots: {
    type: Number,
    min: 0,
    max: 10
  },
  floor: {
    type: Number,
    min: -5,
    max: 200
  },
  total_floors: {
    type: Number,
    min: 1,
    max: 200
  },
  building_age: {
    type: Number,
    min: 0,
    max: 100
  },
  features: [{
    type: String,
    trim: true
  }],
  amenities: [{
    type: String,
    trim: true
  }],
  transport_info: {
    mrt_stations: [{
      type: String,
      trim: true
    }],
    bus_stops: [{
      type: String,
      trim: true
    }],
    distance_to_mrt: {
      type: Number,
      min: 0
    }
  },
  school_district: {
    type: String,
    trim: true,
    maxlength: 100
  },
  status: {
    type: String,
    enum: ['available', 'pending', 'sold', 'rented', 'withdrawn'],
    default: 'available'
  },
  available_from: {
    type: Date
  },
  images: [{
    type: String,
    trim: true
  }],
  documents: [{
    type: String,
    trim: true
  }],
  virtual_tour_url: {
    type: String,
    trim: true
  },
  listing_expires_at: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 索引
PropertySchema.index({ property_type: 1 });
PropertySchema.index({ listing_type: 1 });
PropertySchema.index({ district: 1 });
PropertySchema.index({ city: 1 });
PropertySchema.index({ price: 1 });
PropertySchema.index({ area: 1 });
PropertySchema.index({ status: 1 });
PropertySchema.index({ bedrooms: 1 });
PropertySchema.index({ agent_id: 1 });
PropertySchema.index({ company_id: 1 });
PropertySchema.index({ created_at: -1 });

// 複合索引
PropertySchema.index({ property_type: 1, listing_type: 1 });
PropertySchema.index({ district: 1, property_type: 1 });
PropertySchema.index({ price: 1, area: 1 });
PropertySchema.index({ status: 1, listing_type: 1 });

// 地理位置索引
PropertySchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

export const Property = mongoose.model<IProperty>('Property', PropertySchema);