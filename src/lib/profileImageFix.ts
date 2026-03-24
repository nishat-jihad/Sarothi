import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; // নিশ্চিত হোন আপনার firebase.ts ফাইলটি এই পাথে আছে

/**
 * প্রোফাইল ফটো আপলোড এবং Auth ও Firestore ডাটাবেস আপডেট করার ফাংশন।
 */
export async function uploadProfilePhoto(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // ১. ফাইল ভ্যালিডেশন
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed.');
  if (file.size > 5 * 1024 * 1024) throw new Error('File size must be under 5 MB.');

  const storage = getStorage();
  // ইউজার আইডি অনুযায়ী আলাদা ফোল্ডারে ফাইল সেভ হবে
  const storageRef = ref(storage, `profilePictures/${user.uid}/${Date.now()}_${file.name}`);

  // ২. আপলোড প্রসেস এবং প্রগ্রেস ট্র্যাকিং
  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(pct);
      },
      error => reject(error),
      () => resolve()
    );
  });

  // ৩. আপলোড শেষে ডাউনলোড ইউআরএল সংগ্রহ
  const downloadURL = await getDownloadURL(storageRef);

  // ৪. Firebase Auth প্রোফাইল আপডেট
  await updateProfile(user, { photoURL: downloadURL });

  // ৫. Firestore ইউজার ডকুমেন্ট আপডেট
  await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL });

  return downloadURL;
}
