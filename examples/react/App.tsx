import React, { useState } from 'react';
import { hashRouter } from '../../src/core/hashRouter';
import BasicExample from './examples/BasicExample';
import AdvancedExample from './examples/AdvancedExample';
import ContextExample from './examples/ContextExample';
import './app.css';

type ExampleType = 'basic' | 'advanced' | 'context';

const App: React.FC = () => {
    const [activeExample, setActiveExample] = useState<ExampleType>('basic');

    // Reset router when switching examples
    const switchExample = (example: ExampleType) => {
    // Clean up previous router instance
        hashRouter.destroy();
        // Set new example
        setActiveExample(example);
    };

    return (
        <div className="example-app">
            <h1 className="app-title">ClientRouter Examples</h1>
      
            <div className="example-selector">
                <button 
                    className={activeExample === 'basic' ? 'active' : ''} 
                    onClick={() => switchExample('basic')}
                >
                    Basic Example
                </button>
                <button 
                    className={activeExample === 'advanced' ? 'active' : ''} 
                    onClick={() => switchExample('advanced')}
                >
                    Advanced Example
                </button>
                <button 
                    className={activeExample === 'context' ? 'active' : ''} 
                    onClick={() => switchExample('context')}
                >
                    Context Example
                </button>
            </div>
      
            <div className="example-container">
                {activeExample === 'basic' && <BasicExample />}
                {activeExample === 'advanced' && <AdvancedExample />}
                {activeExample === 'context' && <ContextExample />}
            </div>
        </div>
    );
};

export default App;