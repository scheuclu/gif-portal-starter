import React, { useEffect, useState } from 'react';
import linkedinLogo from './assets/linkedin.svg';
import githubLogo from './assets/github.svg';
import instagramLogo from './assets/instagram.svg';
import youtubeLogo from './assets/youtube.svg';

import './App.css';

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';

import kp from './keypair.json'
import Swal from 'sweetalert2'


// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)
// let baseAccount = Keypair.generate(); //TODO

// This is the address of your solana program, if you forgot, just run solana address -k target/deploy/myepicproject-keypair.json
const programID = new PublicKey("GZnUtzwNfMrsK7U9NZT1PwrgnUnu6z9cGwc1v1Q7e5ta");

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}



// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;


const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [inputName, setInputName] = useState('');
  const [gifList, setGifList] = useState([]);

  // Actions
  const checkIfWalletIsConnected = async () => {
    if (window?.solana?.isPhantom) {
      console.log('Phantom wallet found!');
      const response = await window.solana.connect({ onlyIfTrusted: true });
      console.log(
        'Connected with Public Key:',
        response.publicKey.toString()
      );

      /*
       * Set the user's publicKey in state to be used later!
       */
      setWalletAddress(response.publicKey.toString());
    } else {
      alert('Solana object not found! Get a Phantom Wallet 👻');
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
  
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
    else {
      Swal.fire({
        icon: 'error',
        title: 'Solana wallet not found!',
        text: 'This website needs a Solana wallet extension, so you can talk to the Solana blockchain. I recommend using Phantom wallet.',
        footer: '<a href="https://phantom.app" target="_blank">Get Phantom now!</a>'
      })
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const onNameChange = (event) => {
    const { value } = event.target;
    setInputName(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = await getProgram();
      
      console.log("ping");
      console.log(baseAccount.publicKey.toString());
      console.log(provider.wallet.publicKey.toString());
      console.log(SystemProgram.programId.toString());

      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();
  
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const sendGif = async () => {



    if (inputValue.length === 0) {
      console.log("No gif link given!")
      Swal.fire({
        title: "Link to GIF missing?",
        text: "Please enter a valid GIF link in the text-box above!",
        icon: "warning"
      })
      return
    }
    if (inputName.length === 0) {
      console.log("No submitter name given!")
      Swal.fire({
        title: "Name field empty...",
        text: "Please enter your name or alibi in the box above!",
        icon: "warning"
      })
      return
    }
    setInputValue('');
    setInputName('');
    console.log('Gif link:', inputValue);
    console.log('Submitter Name:', inputName);
    try {
      const provider = getProvider()
      const program = await getProgram(); 
  
      await program.rpc.addGif(
        inputValue,
        inputName, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue)
  
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };


  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't been initialized.
      if (gifList === null) {
        return (
          <div className="connected-container">
            <button className="cta-button submit-gif-button" onClick={createGifAccount}>
              Do One-Time Initialization For GIF Program Account
            </button>
          </div>
        )
      } 
      // Otherwise, we're good! Account exists. User can submit GIFs.
      else {
        return(
          <div className="connected-container">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendGif();
              }}
            >
              <input
                type="text"
                placeholder="Enter gif link!"
                value={inputValue}
                onChange={onInputChange}
              />
              <input
                type="text"
                placeholder="Enter your name!"
                value={inputName}
                onChange={onNameChange}
              />
              <button type="submit" className="cta-button submit-gif-button">
                Submit
              </button>
            </form>
            <div className="gif-grid">
              {/* We use index as the key instead, also, the src is now item.gifLink */}
              {gifList.map((item, index) => (
                <div className="gif-item" key={index}>
                  <img src={item.gifLink} />
                  <p className="img-submitter">Submitted by {item.userName}</p>
                </div>
              ))}
            </div>
          </div>
        )
      }
    }



  // UseEffects
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const getProgram = async () => {
    // Get metadata about your solana program
    const idl = await Program.fetchIdl(programID, getProvider());
    // Create a program that you can call
    return new Program(idl, programID, getProvider());
  };
  
  const getGifList = async() => {
    try {
      const program = await getProgram(); 
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Got the account", account)
      setGifList(account.gifList)
  
    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }
  
  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
			{/* This was solely added for some styling fanciness */}
			<div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header"> 🖼 Lukas 2022 GIFs</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {/* Add the condition to show this only if we don't have a wallet address */}
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">

          <a
              className="footer-text"
              href="www.scheuclu.com"
              target="_blank"
              rel="noreferrer"
            >built by scheuclu</a>
          <p>&nbsp;&nbsp;</p>
          <a href="https://www.linkedin.com/in/scheuclu">,
            <img alt="Linkedin Logo" className="social-logo" src={linkedinLogo} />
          </a>
          <a href="https://github.com/scheuclu">,
            <img alt="Github Logo" className="social-logo" src={githubLogo} />
          </a>
          <a href="https://www.instagram.com/scheuclu92">,
            <img alt="Instagram Logo" className="social-logo" src={instagramLogo} />
          </a>
          <a href="https://www.youtube.com/channel/UC0So4gJ11qUZI_dzqVMOq8w">,
            <img alt="Youtube Logo" className="social-logo" src={youtubeLogo} />
          </a>



        </div>
      </div>
    </div>
  );
};

export default App;