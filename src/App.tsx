import React, { memo, useEffect, useState } from "react";

import {
  View,
  getDeviceProfile,
  createNeutralHighlight,
  type RenderStateHighlightGroups,
} from "@novorender/api";
import { createAPI, type SceneData } from "@novorender/data-js-api";
import { FilteredCamera } from "./declarations/models.t";
import Navbar from "./components/Navbar";

const SCENE_ID = "95a89d20dd084d9486e383e131242c4c";

const App = memo(() => {
  const [view, setView] = useState<View | null>(null);
  const [cameraPositions, setCameraPositions] = useState<FilteredCamera[]>([]);

  const renderScene = async () => {
    try {
      const canvas = document.getElementById("canvas") as HTMLCanvasElement;
      const gpuTier = 2;
      const deviceProfile = getDeviceProfile(gpuTier);
      const imports = await View.downloadImports({
        baseUrl: "/novorender/api/",
      });
      const view = new View(canvas, deviceProfile, imports);
      setView(view);

      const dataApi = createAPI({
        serviceUrl: "https://data.novorender.com/api",
      });

      const sceneData = await dataApi.loadScene(SCENE_ID);
      const { url } = sceneData as SceneData;

      const config = await view.loadSceneFromURL(new URL(url));
      const { center, radius } = config.boundingSphere;
      view.activeController.autoFit(center, radius);

      const { activeController } = view;
      const flightController = await view.switchCameraController("flight");
      const controllerState = activeController.serialize();
      activeController.init(controllerState);

      const position = [0, 0, 10];
      const rotation = [0, 0, 0, 1];
      const kind = "pinhole";
      const fov = 60;
      view.modifyRenderState({
        camera: { kind, position, rotation, fov },
      });

      view.modifyRenderState({ grid: { enabled: true } });

      await view.run();
      view.dispose();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    renderScene();
  }, []);

  const handleSaveScenePosition = async (
    event: React.MouseEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (!view) return <h3>There is no view!</h3>;

    const flightController = await view.switchCameraController("flight");

    if (event.shiftKey) {
      const cameraState = view.renderState.camera;
      const savedPositions = [...cameraPositions];

      // save only the position and rotation
      const filteredCamera = {
        position: [...cameraState.position],
        rotation: [...cameraState.rotation],
      };

      savedPositions[index] = filteredCamera;

      setCameraPositions(savedPositions);

      alert(
        `Position ${
          index + 1
        } saved successfully!\nYou can click on the "Position ${
          index + 1
        }" button to see it again! 😁`
      );
    } else {
      const savedPosition = cameraPositions[index];

      if (savedPosition) {
        if (flightController) {
          await flightController.moveTo(
            new Float32Array(savedPosition.position),
            1000,
            new Float32Array(savedPosition.rotation)
          );
        }
      } else {
        alert(
          `You didn't save a position to your favourite position  No${
            index + 1
          }.\nPlease use "shift + left click" to save your favourite position`
        );
      }
    }
  };

  const handleFormSubmit = async (input: string) => {
    if (!view) return;

    try {
      const dataApi = createAPI({
        serviceUrl: "https://data.novorender.com/api",
      });
      const sceneData = await dataApi.loadScene(SCENE_ID);

      const { db } = sceneData;

      if (db) {
        const controller = new AbortController();
        const signal = controller.signal;
        const iterator = db.search(
          {
            searchPattern: [{ property: "name", value: input, exact: false }],
          },
          signal
        );

        const result: number[] = [];

        for await (const object of iterator) {
          result.push(object.id);
        }

        console.log("search result:", result);

        // Show only the results in their neutral colors and hide all other objects
        const renderStateHighlightGroups: RenderStateHighlightGroups = {
          defaultAction: "hide",
          groups: [{ action: createNeutralHighlight(), objectIds: result }],
        };

        // if input is matching with the name of an object, render only that object(s) otherwise render the default scene
        result.length !== 0
          ? view.modifyRenderState({
              highlights: renderStateHighlightGroups,
            })
          : input.trim() === "" || result.length === 0
          ? renderScene()
          : null;
      }
    } catch (error) {
      console.error("Error handling form submission:", error);
    }
  };

  return (
    <>
      <Navbar
        onButtonClick={handleSaveScenePosition}
        onFormSubmit={handleFormSubmit}
      />
      <canvas id="canvas" style={{ width: "100%", height: "100%" }}></canvas>
    </>
  );
});

export default App;
