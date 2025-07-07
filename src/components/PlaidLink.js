import React, { useCallback, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { functions } from '../firebase/config';
import { httpsCallable } from 'firebase/functions';

const PlaidLink = ({ user }) => {
  const [linkToken, setLinkToken] = useState(null);

  const generateToken = async () => {
    try {
      const createLinkToken = httpsCallable(functions, 'createLinkToken');
      const result = await createLinkToken({ userId: user.uid });
      const { link_token } = result.data;
      setLinkToken(link_token);
    } catch (error) {
      console.error("Error creating link token:", error);
    }
  };

  const onSuccess = useCallback(async (public_token) => {
    try {
      const exchangePublicToken = httpsCallable(functions, 'exchangePublicToken');
      await exchangePublicToken({ public_token: public_token, userId: user.uid });
      // You might want to trigger a refetch of transactions here
    } catch (error) {
      console.error("Error exchanging public token:", error);
    }
  }, [user]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  React.useEffect(() => {
    if (!linkToken) {
      generateToken();
    }
  }, [linkToken]);

  return (
    <button onClick={() => open()} disabled={!ready}>
      Connect a bank account
    </button>
  );
};

export default PlaidLink;
