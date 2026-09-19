import React from 'react';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export interface SixAngleImages {
  front: string;
  back: string;
  left: string;
  right: string;
  top: string;
  sole: string;
}

interface UploaderProps {
  images: SixAngleImages;
  onChange: (images: SixAngleImages) => void;
}

const ANGLES: { key: keyof SixAngleImages; label: string; guide: string }[] = [
  { key: 'front', label: '1. Front View', guide: 'Straight eye-level front shot of toe cap guard' },
  { key: 'back', label: '2. Back Heel View', guide: 'Shot of heel cup & ankle strap closure' },
  { key: 'left', label: '3. Left Profile', guide: 'Side profile showing buckle hardware' },
  { key: 'right', label: '4. Right Profile', guide: 'Side profile showing outer sole seam' },
  { key: 'top', label: '5. Top (45° Elevation)', guide: 'Bird-eye angle showing insole & upper T-strap' },
  { key: 'sole', label: '6. Sole / Underside', guide: 'Bottom view showing tire rubber tread pattern' },
];

export const AngleImageUploader: React.FC<UploaderProps> = ({ images, onChange }) => {

  const handleAngleUpload = (key: keyof SixAngleImages, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange({
          ...images,
          [key]: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const filledCount = Object.values(images).filter(Boolean).length;
  const isComplete = filledCount === 6;

  return (
    <div className="space-y-4 glass-panel p-6 border-copper/30">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif font-bold text-lg text-text-primary">
            Product Photography Studio Angles (6 Angles)
          </h3>
          <p className="text-xs text-text-muted">
            Upload exact camera shots per angle for background removal and multi-angle product showcase.
          </p>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
          isComplete ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-amber-950 text-amber-400 border border-amber-700'
        }`}>
          {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {filledCount} / 6 Slots Uploaded
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {ANGLES.map(ang => {
          const val = images[ang.key];
          return (
            <div key={ang.key} className="p-3 rounded-xl bg-espresso-900 border border-glass-border space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-brass">{ang.label}</span>
                {val && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>

              <div className="relative aspect-video rounded-lg overflow-hidden bg-espresso-800 border border-dashed border-glass-border flex items-center justify-center">
                {val ? (
                  <img src={val} alt={ang.label} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2 text-text-muted">
                    <Upload className="w-5 h-5 mx-auto mb-1 text-copper" />
                    <span className="text-[10px] block leading-tight">{ang.guide}</span>
                  </div>
                )}
              </div>

              <label className="btn-glass text-[11px] py-1.5 px-3 w-full text-center cursor-pointer block">
                {val ? 'Replace Shot' : 'Upload Angle'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAngleUpload(ang.key, e)}
                  className="hidden"
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
