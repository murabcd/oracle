import { Canvas } from "@/components/canvas";
import { Controls } from "@/components/controls";
import { Reasoning } from "@/components/reasoning";
import { Toolbar } from "@/components/toolbar";
import { ModelsProvider } from "@/providers/models/client";
import { ReactFlowProvider } from "../providers/react-flow";

export const maxDuration = 800;

const Index = () => (
  <ModelsProvider>
    <ReactFlowProvider>
      <div className="flex h-screen w-screen items-stretch overflow-hidden">
        <div className="relative flex-1">
          <Canvas>
            <Controls />
            <Toolbar />
          </Canvas>
        </div>
        <Reasoning />
      </div>
    </ReactFlowProvider>
  </ModelsProvider>
);

export default Index;
