import { useId, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import Button from '../../../../shared/ui/Button/Button';
import FormField from '../../../../shared/ui/FormField/FormField';
import { defaultAvatar, isDefaultAvatar, resizeImage } from '../../lib/avatar';
import type { Profile } from '../../model/types';
import './ProfileEditForm.scss';

const PHOTO_ERRORS = {
  type: 'Choose an image file.',
  read: 'This image could not be read. Try another file.',
};

type EditableProfile = Pick<Profile, 'name' | 'avatar'>;

interface ProfileEditFormProps {
  profile: EditableProfile;
  onSave: (changes: EditableProfile) => void;
  onCancel: () => void;
}

// Edit mode of the profile header. The new photo and name only replace the old ones on Save.
function ProfileEditForm({ profile, onSave, onCancel }: ProfileEditFormProps) {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [photoError, setPhotoError] = useState<{ message: string; key: number } | null>(null);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Counts photo choices (picks and removals): a resize that finishes after a newer choice is dropped.
  const photoChoiceRef = useRef(0);
  const uploadButtonId = useId();
  const trimmedName = name.trim();

  // Keyed by the choice, so the same message after another pick is announced again.
  const showPhotoError = (message: string) => setPhotoError({ message, key: photoChoiceRef.current });

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    // Cleared at once, so picking the same file again is still a change.
    input.value = '';
    if (!file) return;
    photoChoiceRef.current += 1;
    const choice = photoChoiceRef.current;
    if (!file.type.startsWith('image/')) {
      setIsReadingPhoto(false);
      showPhotoError(PHOTO_ERRORS.type);
      return;
    }

    setIsReadingPhoto(true);
    const result = await resizeImage(file).then(
      (dataUrl) => ({ dataUrl }),
      () => ({ error: PHOTO_ERRORS.read })
    );
    if (choice !== photoChoiceRef.current) return;
    setIsReadingPhoto(false);
    if ('error' in result) {
      showPhotoError(result.error);
      return;
    }
    setAvatar(result.dataUrl);
    setPhotoError(null);
  };

  const removePhoto = () => {
    photoChoiceRef.current += 1;
    setIsReadingPhoto(false);
    setAvatar(defaultAvatar);
    setPhotoError(null);
    // This button disappears with the photo, so focus moves to the one that adds a new photo.
    document.getElementById(uploadButtonId)?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedName || isReadingPhoto) return;
    onSave({ name: trimmedName, avatar });
  };

  return (
    <form className="profile-edit" aria-labelledby="profile-edit-title" onSubmit={handleSubmit}>
      <h1 id="profile-edit-title" className="profile-edit__title">Edit profile</h1>

      <div className="profile-edit__photo">
        <img className="profile-edit__avatar" src={avatar} alt="" width="80" height="80" />
        <div className="profile-edit__photo-body">
          <div className="profile-edit__photo-actions">
            <Button
              id={uploadButtonId}
              icon={<ImagePlus />}
              aria-label="Upload photo for your profile"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload photo
            </Button>
            {!isDefaultAvatar(avatar) && (
              <Button variant="ghost" className="profile-edit__remove" icon={<Trash2 />} onClick={removePhoto}>
                Remove photo
              </Button>
            )}
          </div>
          <p className="profile-edit__hint">
            {isReadingPhoto ? 'Preparing the photo…' : 'Cropped to a square from the centre.'}
          </p>
          {photoError && (
            <p key={photoError.key} className="profile-edit__error" role="alert">{photoError.message}</p>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
        </div>
      </div>

      <div className="profile-edit__name">
        <FormField
          id="profile-name"
          label="Display name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="nickname"
          maxLength={20}
          autoFocus
          invalid={!trimmedName}
          describedBy={trimmedName ? undefined : 'profile-name-error'}
        />
        {!trimmedName && <p id="profile-name-error" className="profile-edit__error">Enter a display name.</p>}
      </div>

      <div className="profile-edit__actions">
        <Button type="submit" variant="primary" disabled={!trimmedName || isReadingPhoto}>Save</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export default ProfileEditForm;
