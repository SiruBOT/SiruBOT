import { BaseLavalinkHandler } from './base';
import { LavalinkNode, NodeManager } from 'lavalink-client';

export class NodeHandler extends BaseLavalinkHandler {
	private nodeManager: NodeManager | null;
	constructor() {
		super();
		this.nodeManager = null;
	}

	public setup(nodeManager: NodeManager): void {
		this.logger.info('Setup lavalink nodeHandler');
		this.nodeManager = nodeManager;

		nodeManager.on('create', this.handleNodeCreate.bind(this));
		nodeManager.on('connect', this.handleNodeConnect.bind(this));
		nodeManager.on('disconnect', this.handleNodeDisconnect.bind(this));
		nodeManager.on('reconnecting', this.handleNodeReconnecting.bind(this));
		nodeManager.on('destroy', this.handleNodeDestroy.bind(this));
		nodeManager.on('error', this.handleNodeError.bind(this));
		nodeManager.on('resumed', this.handleNodeResumed.bind(this));
	}

	private handleNodeCreate(node: LavalinkNode) {
		this.logger.info(`Node created: ${node.options.id}`);
	}

	//@ts-ignore
	private handleNodeConnect(node: LavalinkNode) {
		this.logger.info(`Node connected: ${node.options.id}`);
		// Enable resuming for 5 minutes
		node.updateSession(true, 300_000);
	}

	//@ts-ignore
	private handleNodeResumed(node: LavalinkNode, payload: any, players: any) {
		this.logger.info(`Node resumed: ${node.options.id}`);
	}

	//@ts-ignore
	private handleNodeDisconnect(node: LavalinkNode, reason: { code?: number | undefined; reason?: string | undefined }) {
		this.logger.info(`Node disconnected: ${node.options.id}`);
	}

	private handleNodeReconnecting(node: LavalinkNode) {
		this.logger.info(`Node reconnecting: ${node.options.id}`);
	}

	private handleNodeDestroy(node: LavalinkNode) {
		this.logger.info(`Node destroyed: ${node.options.id}`);
	}

	//@ts-ignore
	private handleNodeError(node: LavalinkNode, error: Error, payload: any) {
		this.logger.info(`Node error: ${node.options.id}`);
	}

	public cleanup(): void {
		this.logger.info('Cleanup lavalink nodeHandler');
		this.nodeManager?.off('create', this.handleNodeCreate.bind(this));
		this.nodeManager?.off('connect', this.handleNodeConnect.bind(this));
		this.nodeManager?.off('disconnect', this.handleNodeDisconnect.bind(this));
		this.nodeManager?.off('reconnecting', this.handleNodeReconnecting.bind(this));
		this.nodeManager?.off('destroy', this.handleNodeDestroy.bind(this));
		this.nodeManager?.off('error', this.handleNodeError.bind(this));
		this.nodeManager?.off('resumed', this.handleNodeResumed.bind(this));
	}
}
