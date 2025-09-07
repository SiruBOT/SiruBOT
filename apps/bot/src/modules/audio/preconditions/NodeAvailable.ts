import { AllFlowsPrecondition } from '@sapphire/framework';

export class NodeAvailablePrecondition extends AllFlowsPrecondition {
	#message = '💡  현재 사용 가능한 노드가 없어요. 잠시 후 다시 시도해 주세요.';

	public override chatInputRun() {
		return this.runCheck();
	}

	public override contextMenuRun() {
		return this.runCheck();
	}

	public override messageRun() {
		return this.runCheck();
	}

	private runCheck() {
		return this.container.audio.nodeManager.nodes.filter((node) => node.connected).size > 0 ? this.ok() : this.error({ message: this.#message });
	}
}
