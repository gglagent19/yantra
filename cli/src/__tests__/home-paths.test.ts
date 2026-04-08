import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  describeLocalInstancePaths,
  expandHomePrefix,
  resolveYantraHomeDir,
  resolveYantraInstanceId,
} from "../config/home.js";

const ORIGINAL_ENV = { ...process.env };

describe("home path resolution", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("defaults to ~/.yantra and default instance", () => {
    delete process.env.YANTRA_HOME;
    delete process.env.YANTRA_INSTANCE_ID;

    const paths = describeLocalInstancePaths();
    expect(paths.homeDir).toBe(path.resolve(os.homedir(), ".yantra"));
    expect(paths.instanceId).toBe("default");
    expect(paths.configPath).toBe(path.resolve(os.homedir(), ".yantra", "instances", "default", "config.json"));
  });

  it("supports YANTRA_HOME and explicit instance ids", () => {
    process.env.YANTRA_HOME = "~/yantra-home";

    const home = resolveYantraHomeDir();
    expect(home).toBe(path.resolve(os.homedir(), "yantra-home"));
    expect(resolveYantraInstanceId("dev_1")).toBe("dev_1");
  });

  it("rejects invalid instance ids", () => {
    expect(() => resolveYantraInstanceId("bad/id")).toThrow(/Invalid instance id/);
  });

  it("expands ~ prefixes", () => {
    expect(expandHomePrefix("~")).toBe(os.homedir());
    expect(expandHomePrefix("~/x/y")).toBe(path.resolve(os.homedir(), "x/y"));
  });
});
