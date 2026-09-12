export interface PincodeDetails {
  city: string;
  state: string;
  district: string;
  officeName: string;
  status: 'success' | 'error';
  message?: string;
}

/**
 * Automatically fetch address details (City, District, State) from India Post Postal API given a 6-digit PIN code.
 */
export const fetchAddressByPincode = async (pincode: string): Promise<PincodeDetails | null> => {
  const cleanPin = pincode.replace(/\D/g, '');
  if (cleanPin.length !== 6) return null;

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
    if (!res.ok) return null;
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0 && data[0].Status === 'Success') {
      const postOffices = data[0].PostOffice;
      if (Array.isArray(postOffices) && postOffices.length > 0) {
        const po = postOffices[0];
        return {
          city: po.District || po.Name || po.Block || '',
          state: po.State || '',
          district: po.District || '',
          officeName: po.Name || '',
          status: 'success',
        };
      }
    }
  } catch (err) {
    console.warn('India Post Pincode API lookup error:', err);
  }
  return null;
};
